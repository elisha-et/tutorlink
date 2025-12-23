# main.py — TutorLink API (MVP with Supabase)
# Includes:
# - Supabase JWT verification
# - Tutor profile search
# - Help requests: create, list, update status
# - Multi-role support (users can be both student and tutor)
# - Transcript upload and AI verification (Phase 2)
# Note: Auth is handled by Supabase, not this API

from fastapi import FastAPI, Depends, HTTPException, Header, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import base64
import json
import uuid
import io
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import jwt, JWTError
from openai import OpenAI

# Try to import PyMuPDF for PDF support, but make it optional
try:
    import fitz  # PyMuPDF
    PDF_SUPPORT = True
except ImportError:
    PDF_SUPPORT = False
    print("Warning: PyMuPDF not installed. PDF uploads will be rejected. Install with: pip install pymupdf")

load_dotenv()

# ---------------------------
# App & CORS
# ---------------------------
app = FastAPI(title="TutorLink API (MVP)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "TutorLink API is up"}

@app.get("/ping")
def ping():
    return {"status": "ok"}

# ---------------------------
# Supabase Client
# ---------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Warning: Supabase environment variables not set")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ---------------------------
# OpenAI Client
# ---------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai_client: Optional[OpenAI] = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    print("Warning: OPENAI_API_KEY not set - transcript verification will not work")

# ---------------------------
# Constants
# ---------------------------
MAX_TRANSCRIPT_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_TRANSCRIPT_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"]
TRANSCRIPT_BUCKET = "transcripts"

# ---------------------------
# Auth - Verify Supabase JWT
# ---------------------------
def get_current_user(authorization: str = Header(None)) -> dict:
    """
    Verify the Supabase JWT token and return the user payload.
    The token is passed in the Authorization header as 'Bearer <token>'.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.split(" ", 1)[1]
    
    try:
        # Decode the JWT using Supabase's JWT secret
        # Supabase JWTs use HS256 algorithm
        if SUPABASE_JWT_SECRET:
            payload = jwt.decode(
                token, 
                SUPABASE_JWT_SECRET, 
                algorithms=["HS256"],
                audience="authenticated"
            )
        else:
            # Fallback: Use Supabase client to verify (slower but works without JWT secret)
            if not supabase:
                raise HTTPException(status_code=500, detail="Supabase not configured")
            user_response = supabase.auth.get_user(token)
            if not user_response.user:
                raise HTTPException(status_code=401, detail="Invalid token")
            return {
                "sub": user_response.user.id,
                "email": user_response.user.email,
            }
        
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

# ---------------------------
# Helper: Get User Roles
# ---------------------------
def get_user_roles(user_id: str) -> List[str]:
    """
    Get user's roles from the profiles table.
    Handles both new (roles array) and legacy (role field) schema.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    profile_response = supabase.table("profiles").select("role, roles, active_role").eq("id", user_id).single().execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile = profile_response.data
    
    # Use roles array if available, otherwise fall back to legacy role field
    roles = profile.get("roles") or []
    if not roles and profile.get("role"):
        roles = [profile.get("role")]
    
    return roles

def get_active_role(user_id: str) -> str:
    """
    Get user's active role from the profiles table.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    profile_response = supabase.table("profiles").select("role, roles, active_role").eq("id", user_id).single().execute()
    if not profile_response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile = profile_response.data
    
    # Use active_role if available, otherwise first role in array, otherwise legacy role
    active_role = profile.get("active_role")
    if not active_role:
        roles = profile.get("roles") or []
        if roles:
            active_role = roles[0]
        else:
            active_role = profile.get("role")
    
    return active_role

def user_has_role(user_id: str, required_role: str) -> bool:
    """
    Check if user has a specific role.
    """
    roles = get_user_roles(user_id)
    return required_role in roles

# ---------------------------
# Schemas
# ---------------------------
class TutorProfileIn(BaseModel):
    bio: str = ""
    subjects: list[str] = []
    availability: list[str] = []
    scheduling_link: str = ""

class HelpReqIn(BaseModel):
    tutor_id: str  # UUID of the tutor
    subject: str
    description: str = ""
    preferred_times: list[str] = []

class HelpReqUpdate(BaseModel):
    status: str  # "pending" | "accepted" | "declined" | "closed"

# ---------------------------
# Tutor Profile Endpoints
# ---------------------------
@app.get("/tutors/search")
def search_tutors(
    subject: Optional[str] = None,
    availability: Optional[str] = None,
    verified_only: bool = Query(False, description="Only show verified tutors"),
):
    """
    Search for tutors with non-strict (fuzzy) matching.
    Filters by subject and/or availability using partial matching.
    Returns public tutor profile information.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        # Query tutor_profiles joined with profiles
        query = supabase.table("tutor_profiles").select(
            "id, bio, subjects, availability, scheduling_link, transcript_verification_status, profiles(name)"
        )
        
        # Filter by verification status if requested
        if verified_only:
            query = query.eq("transcript_verification_status", "verified")
        
        response = query.execute()
        
        results = []
        subject_lower = subject.lower().strip() if subject else None
        availability_lower = availability.lower().strip() if availability else None
        
        for tp in response.data:
            subjects_list = tp.get("subjects") or []
            availability_list = tp.get("availability") or []
            
            # Non-strict subject matching: check if search term appears anywhere in any subject
            if subject_lower:
                subject_matches = any(
                    subject_lower in s.lower() for s in subjects_list
                )
                if not subject_matches:
                    continue
            
            # Non-strict availability matching: check if search term appears anywhere in any availability entry
            if availability_lower:
                availability_matches = any(
                    availability_lower in av.lower() for av in availability_list
                )
                if not availability_matches:
                    continue
            
            results.append({
                "tutor_id": tp["id"],
                "name": tp.get("profiles", {}).get("name", "Unknown"),
                "bio": tp.get("bio", ""),
                "subjects": subjects_list,
                "availability": availability_list,
                "is_verified": tp.get("transcript_verification_status") == "verified",
            })
        
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching tutors: {str(e)}")

@app.get("/tutors/{tutor_id}")
def get_tutor(tutor_id: str):
    """Get a specific tutor's public profile including verification status."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    try:
        response = supabase.table("tutor_profiles").select(
            "id, bio, subjects, availability, scheduling_link, transcript_verification_status, transcript_verified_at, profiles(name, phone)"
        ).eq("id", tutor_id).single().execute()
        
        tp = response.data
        return {
            "tutor_id": tp["id"],
            "name": tp.get("profiles", {}).get("name", "Unknown"),
            "bio": tp.get("bio", ""),
            "subjects": tp.get("subjects") or [],
            "availability": tp.get("availability") or [],
            "scheduling_link": tp.get("scheduling_link"),
            "is_verified": tp.get("transcript_verification_status") == "verified",
            "transcript_verification_status": tp.get("transcript_verification_status"),
            "transcript_verified_at": tp.get("transcript_verified_at"),
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="Tutor not found")

# ---------------------------
# Transcript Upload & Verification Endpoints
# ---------------------------
@app.post("/tutors/transcript/upload")
async def upload_transcript(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Upload a transcript file (PDF or image) for verification.
    Requires tutor role.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = current_user.get("sub")
    
    # Verify user has tutor role
    if not user_has_role(user_id, "tutor"):
        raise HTTPException(
            status_code=403,
            detail="Only tutors can upload transcripts"
        )
    
    # Validate file type
    content_type = file.content_type
    if content_type not in ALLOWED_TRANSCRIPT_TYPES:
        allowed = "PNG, JPG" if not PDF_SUPPORT else "PDF, PNG, JPG"
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {allowed}"
        )
    
    # Reject PDFs if PyMuPDF is not available
    if content_type == "application/pdf" and not PDF_SUPPORT:
        raise HTTPException(
            status_code=400,
            detail="PDF support is not available. Please upload a PNG or JPG image instead, or install PyMuPDF: pip install pymupdf"
        )
    
    # Read file content
    file_content = await file.read()
    
    # Validate file size
    if len(file_content) > MAX_TRANSCRIPT_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_TRANSCRIPT_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique filename
    file_ext = file.filename.split(".")[-1] if file.filename else "pdf"
    storage_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"
    
    try:
        # Upload to Supabase Storage
        storage_response = supabase.storage.from_(TRANSCRIPT_BUCKET).upload(
            path=storage_path,
            file=file_content,
            file_options={"content-type": content_type}
        )
        
        # Get the public URL (or signed URL for private buckets)
        file_url = supabase.storage.from_(TRANSCRIPT_BUCKET).get_public_url(storage_path)
        
        # Update tutor profile with transcript info
        supabase.table("tutor_profiles").update({
            "transcript_file_url": storage_path,  # Store path, not full URL
            "transcript_verification_status": "pending",
            "transcript_verified_at": None,
            "transcript_verification_data": None,
        }).eq("id", user_id).execute()
        
        return {
            "success": True,
            "message": "Transcript uploaded successfully",
            "file_path": storage_path,
            "status": "pending"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading transcript: {str(e)}")


@app.post("/tutors/transcript/verify")
async def verify_transcript(
    current_user: dict = Depends(get_current_user),
):
    """
    Trigger AI verification of the uploaded transcript.
    Requires tutor role and a previously uploaded transcript.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    if not openai_client:
        raise HTTPException(status_code=500, detail="OpenAI not configured - cannot verify transcripts")
    
    user_id = current_user.get("sub")
    
    # Verify user has tutor role
    if not user_has_role(user_id, "tutor"):
        raise HTTPException(
            status_code=403,
            detail="Only tutors can verify transcripts"
        )
    
    # Get tutor profile with transcript info
    try:
        tutor_response = supabase.table("tutor_profiles").select(
            "transcript_file_url, subjects"
        ).eq("id", user_id).single().execute()
        
        if not tutor_response.data:
            raise HTTPException(status_code=404, detail="Tutor profile not found")
        
        tutor_data = tutor_response.data
        transcript_path = tutor_data.get("transcript_file_url")
        tutor_subjects = tutor_data.get("subjects") or []
        
        if not transcript_path:
            raise HTTPException(
                status_code=400,
                detail="No transcript uploaded. Please upload a transcript first."
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching tutor profile: {str(e)}")
    
    # Download transcript from storage
    try:
        file_response = supabase.storage.from_(TRANSCRIPT_BUCKET).download(transcript_path)
        file_content = file_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading transcript: {str(e)}")
    
    # Determine file type from path
    is_pdf = transcript_path.lower().endswith(".pdf")
    
    # Convert PDF to image if needed (OpenAI Vision API only accepts images)
    if is_pdf:
        if not PDF_SUPPORT:
            raise HTTPException(
                status_code=500,
                detail="PDF support is not available. Please upload a PNG or JPG image instead, or install PyMuPDF: pip install pymupdf"
            )
        
        try:
            # Open PDF with PyMuPDF
            pdf_document = fitz.open(stream=file_content, filetype="pdf")
            
            # Get the first page (transcripts are usually single page or first page has main info)
            if len(pdf_document) == 0:
                raise HTTPException(status_code=400, detail="PDF appears to be empty")
            
            page = pdf_document[0]
            
            # Convert page to image (PNG format)
            # Use zoom factor for better quality
            zoom = 2.0  # 2x zoom for better resolution
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image then to bytes
            img_data = pix.tobytes("png")
            pdf_document.close()
            
            # Use the converted image
            file_content = img_data
            mime_type = "image/png"
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error converting PDF to image: {str(e)}. Please try uploading a PNG or JPG image instead."
            )
    else:
        # For images, determine MIME type
        if transcript_path.lower().endswith(".png"):
            mime_type = "image/png"
        else:
            mime_type = "image/jpeg"
    
    # Convert to base64 for OpenAI Vision API
    base64_image = base64.b64encode(file_content).decode("utf-8")
    
    # Build the verification prompt
    subjects_list = ", ".join(tutor_subjects) if tutor_subjects else "No subjects specified"
    
    verification_prompt = f"""You are analyzing a university transcript image to verify a tutor's qualifications.

The tutor claims to teach these subjects: {subjects_list}

Please analyze this transcript and provide a JSON response with the following structure:
{{
    "verified_courses": [
        {{
            "course_name": "Course name from transcript",
            "grade": "Letter grade (A, A-, B+, etc.)",
            "grade_points": 4.0,
            "matches_subject": "Which tutor subject this matches, or null if no match"
        }}
    ],
    "authenticity_score": 0.95,
    "authenticity_notes": "Brief notes on why the transcript appears authentic or suspicious",
    "overall_status": "verified",
    "rejection_reason": null,
    "summary": "Brief summary of verification results"
}}

Verification criteria:
1. Extract ALL courses and grades visible on the transcript
2. For courses matching tutor's subjects, verify grades are B+ (3.3) or higher
3. Assess authenticity: look for consistent formatting, official markings, realistic course progressions
4. Set overall_status to "verified" if:
   - At least one course matches a tutor subject with grade B+ or higher
   - Authenticity score is 0.7 or higher
5. Set overall_status to "rejected" otherwise, with a clear rejection_reason

IMPORTANT: Return ONLY valid JSON, no markdown or other formatting."""

    try:
        # Call OpenAI Vision API
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": verification_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=2000,
        )
        
        # Parse the response
        ai_response = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            # Clean up response if it has markdown code blocks
            if "```json" in ai_response:
                ai_response = ai_response.split("```json")[1].split("```")[0]
            elif "```" in ai_response:
                ai_response = ai_response.split("```")[1].split("```")[0]
            
            verification_data = json.loads(ai_response.strip())
        except json.JSONDecodeError:
            # If parsing fails, create a default rejected response
            verification_data = {
                "verified_courses": [],
                "authenticity_score": 0,
                "authenticity_notes": "Failed to parse transcript",
                "overall_status": "rejected",
                "rejection_reason": "Could not analyze the transcript image. Please upload a clearer image.",
                "summary": "Verification failed due to image quality or format"
            }
        
        # Determine final status
        final_status = verification_data.get("overall_status", "rejected")
        if final_status not in ["verified", "rejected"]:
            final_status = "rejected"
        
        # Update tutor profile with verification results
        supabase.table("tutor_profiles").update({
            "transcript_verification_status": final_status,
            "transcript_verified_at": datetime.utcnow().isoformat() if final_status == "verified" else None,
            "transcript_verification_data": verification_data,
        }).eq("id", user_id).execute()
        
        return {
            "success": True,
            "status": final_status,
            "verification_data": verification_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during verification: {str(e)}")


@app.get("/tutors/transcript/status")
def get_transcript_status(
    current_user: dict = Depends(get_current_user),
):
    """
    Get the current transcript verification status for the authenticated tutor.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = current_user.get("sub")
    
    # Verify user has tutor role
    if not user_has_role(user_id, "tutor"):
        raise HTTPException(
            status_code=403,
            detail="Only tutors can view transcript status"
        )
    
    try:
        response = supabase.table("tutor_profiles").select(
            "transcript_file_url, transcript_verification_status, transcript_verified_at, transcript_verification_data"
        ).eq("id", user_id).single().execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Tutor profile not found")
        
        data = response.data
        return {
            "has_transcript": bool(data.get("transcript_file_url")),
            "status": data.get("transcript_verification_status"),
            "verified_at": data.get("transcript_verified_at"),
            "verification_data": data.get("transcript_verification_data"),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transcript status: {str(e)}")

# ---------------------------
# Help Request Endpoints
# ---------------------------
@app.post("/help-requests")
def create_help_request(
    body: HelpReqIn,
    current_user: dict = Depends(get_current_user),
):
    """
    Create a help request from a student to a specific tutor.
    User must have 'student' role (can also be a tutor with student role).
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    student_id = current_user.get("sub")
    
    # Verify the requester has student role
    if not user_has_role(student_id, "student"):
        raise HTTPException(
            status_code=403, 
            detail="You need the student role to create help requests. Add it from your profile settings."
        )
    
    # Create the help request
    try:
        response = supabase.table("help_requests").insert({
            "student_id": student_id,
            "tutor_id": body.tutor_id,
            "subject": body.subject,
            "description": body.description,
            "preferred_times": body.preferred_times,
            "status": "pending",
        }).execute()
        
        return {"id": response.data[0]["id"], "status": "pending"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating request: {str(e)}")

@app.get("/help-requests")
def list_help_requests(
    status: Optional[str] = Query(None),
    as_role: Optional[str] = Query(None, description="View requests as 'student' or 'tutor'"),
    current_user: dict = Depends(get_current_user),
):
    """
    List help requests.
    - If as_role='student': Show requests the user created (as student).
    - If as_role='tutor': Show requests sent to the user (as tutor).
    - If as_role not specified: Use user's active role.
    
    Users with both roles can view both sets of requests by specifying as_role.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = current_user.get("sub")
    
    # Get user's roles and determine which view to show
    user_roles = get_user_roles(user_id)
    
    # Determine which role to use for this request
    view_role = as_role
    if not view_role:
        view_role = get_active_role(user_id)
    
    # Validate the requested role
    if view_role and view_role not in user_roles:
        raise HTTPException(
            status_code=403, 
            detail=f"You don't have the {view_role} role"
        )
    
    try:
        # Build query based on role
        if view_role == "student":
            query = supabase.table("help_requests").select("*").eq("student_id", user_id)
        else:  # tutor
            query = supabase.table("help_requests").select("*").eq("tutor_id", user_id)
        
        # Filter by status if provided
        if status:
            query = query.eq("status", status)
        
        response = query.order("created_at", desc=True).execute()
        
        items = []
        for hr in response.data:
            item = {
                "id": hr["id"],
                "subject": hr["subject"],
                "description": hr.get("description", ""),
                "status": hr["status"],
                "preferred_times": hr.get("preferred_times") or [],
                "created_at": hr.get("created_at"),
            }
            
            # Fetch names separately using the IDs
            if view_role == "student":
                # Get tutor name
                item["tutor_id"] = hr["tutor_id"]
                try:
                    tutor_profile = supabase.table("profiles").select("name").eq("id", hr["tutor_id"]).single().execute()
                    item["tutor_name"] = tutor_profile.data.get("name", "Unknown") if tutor_profile.data else "Unknown"
                except:
                    item["tutor_name"] = "Unknown"
            else:
                # Get student name
                item["student_id"] = hr["student_id"]
                try:
                    student_profile = supabase.table("profiles").select("name").eq("id", hr["student_id"]).single().execute()
                    item["student_name"] = student_profile.data.get("name", "Unknown") if student_profile.data else "Unknown"
                except:
                    item["student_name"] = "Unknown"
            
            items.append(item)
        
        return items
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing requests: {str(e)}")

@app.patch("/help-requests/{req_id}")
def update_help_request(
    req_id: str,
    body: HelpReqUpdate,
    current_user: dict = Depends(get_current_user),
):
    """
    Update help request status.
    - Users with tutor role can accept/decline requests sent to them.
    - Users with student role can close their own requests.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = current_user.get("sub")
    
    valid_statuses = ["pending", "accepted", "declined", "closed"]
    if body.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Get the help request
    hr_response = supabase.table("help_requests").select("*").eq("id", req_id).single().execute()
    if not hr_response.data:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    hr = hr_response.data
    
    # Get user's roles
    user_roles = get_user_roles(user_id)
    
    # Authorization checks based on roles
    is_student_owner = hr["student_id"] == user_id and "student" in user_roles
    is_tutor_recipient = hr["tutor_id"] == user_id and "tutor" in user_roles
    
    if body.status == "closed":
        # Only the student who created the request can close it
        if not is_student_owner:
            raise HTTPException(status_code=403, detail="Only the student who created this request can close it")
    elif body.status in ["accepted", "declined"]:
        # Only the tutor the request was sent to can accept/decline
        if not is_tutor_recipient:
            raise HTTPException(status_code=403, detail="Only the tutor this request was sent to can accept or decline it")
    else:
        raise HTTPException(status_code=403, detail="Invalid status change")
    
    # Update the request
    try:
        supabase.table("help_requests").update({
            "status": body.status
        }).eq("id", req_id).execute()
        
        return {"ok": True, "status": body.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating request: {str(e)}")

@app.get("/help-requests/{req_id}/contact")
def get_contact_info(
    req_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get contact info for a matched request.
    Only available after request is accepted.
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not configured")
    
    user_id = current_user.get("sub")
    
    # Get the help request
    hr_response = supabase.table("help_requests").select("*").eq("id", req_id).single().execute()
    if not hr_response.data:
        raise HTTPException(status_code=404, detail="Help request not found")
    
    hr = hr_response.data
    
    # Must be accepted
    if hr["status"] != "accepted":
        raise HTTPException(status_code=403, detail="Contact info only available after request is accepted")
    
    # Must be the student or tutor involved
    if user_id not in [hr["student_id"], hr["tutor_id"]]:
        raise HTTPException(status_code=403, detail="You are not part of this request")
    
    # Get both profiles
    try:
        student_profile = supabase.table("profiles").select("name, phone").eq("id", hr["student_id"]).single().execute()
        tutor_profile = supabase.table("profiles").select("name, phone").eq("id", hr["tutor_id"]).single().execute()
        tutor_details = supabase.table("tutor_profiles").select("scheduling_link").eq("id", hr["tutor_id"]).single().execute()
        
        # Get emails from auth (would need admin API, so we'll skip for now)
        
        return {
            "student": {
                "name": student_profile.data.get("name"),
                "phone": student_profile.data.get("phone"),
            },
            "tutor": {
                "name": tutor_profile.data.get("name"),
                "phone": tutor_profile.data.get("phone"),
                "scheduling_link": tutor_details.data.get("scheduling_link") if tutor_details.data else None,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting contact info: {str(e)}")

# ---------------------------
# User Profile Endpoints
# ---------------------------
@app.get("/me/roles")
def get_my_roles(current_user: dict = Depends(get_current_user)):
    """
    Get current user's roles and active role.
    """
    user_id = current_user.get("sub")
    
    try:
        roles = get_user_roles(user_id)
        active_role = get_active_role(user_id)
        
        return {
            "roles": roles,
            "active_role": active_role,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting roles: {str(e)}")
