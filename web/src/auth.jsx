import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { setToken } from "./api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    // Check if Supabase is initialized
    if (!supabase) {
      console.error("Supabase client not initialized. Check your .env file.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let timeoutId;

    // Safety timeout - ensure loading is set to false after 5 seconds max
    timeoutId = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      clearTimeout(timeoutId);
      
      if (session) {
        setSession(session);
        setToken(session.access_token);
        
        // Immediately set minimal user data to unblock UI
        const minimalUser = {
          id: session.user.id,
          email: session.user.email,
          roles: [],
          activeRole: null,
          name: null,
          phone: null,
        };
        setUser(minimalUser);
        setLoading(false);
        
        // Then try to load full profile in background
        loadUserProfile(session.user.id).catch(() => {
          // Profile load failed, but user already has minimal data
        });
      } else {
        setLoading(false);
      }
    }).catch((error) => {
      console.error("Error getting session:", error);
      clearTimeout(timeoutId);
      if (isMounted) {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        clearTimeout(timeoutId);
        setSession(session);
        
        try {
          if (session) {
            setToken(session.access_token);
            
            // Immediately set minimal user data to unblock UI
            const minimalUser = {
              id: session.user.id,
              email: session.user.email,
              roles: [],
              activeRole: null,
              name: null,
              phone: null,
            };
            setUser(minimalUser);
            setLoading(false);
            
            // Then try to load full profile in background
            loadUserProfile(session.user.id).catch(() => {
              // Profile load failed, but user already has minimal data
            });
          } else {
            // SIGNED_OUT event or no session - clear everything
            setUser(null);
            setToken(null);
            setSession(null);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error in onAuthStateChange handler:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Load user profile from profiles table
  async function loadUserProfile(userId) {
    if (!supabase) {
      console.error("Supabase client not initialized");
      return;
    }

    try {
      // Try querying profiles table - handle 406 and other errors gracefully
      // Use a simpler query format to avoid 406 errors
      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, roles, active_role, name, phone")
        .eq("id", userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing rows gracefully
      
      // If 406 error or profile not found, just return (user already has minimal data)
      if (error) {
        if (error.code === "PGRST116" || error.status === 406 || error.message?.includes("406")) {
          // Don't update user - keep the minimal data that was already set
          return;
        }
        // For other errors, return without updating - user already has minimal data
        return;
      }

      // Profile data loaded successfully - update user with full profile
      if (data) {
        // Get auth user to combine with profile data
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Handle both old (single role) and new (roles array) schema
          let roles = data.roles || [];
          let activeRole = data.active_role;
          
          // Fallback: if roles array is empty but old role field exists, use it
          if (roles.length === 0 && data.role) {
            roles = [data.role];
            activeRole = data.role;
          }
          
          setUser({
            id: authUser.id,
            email: authUser.email,
            roles: roles,
            activeRole: activeRole,
            // Keep legacy 'role' for backward compatibility
            role: activeRole,
            name: data.name,
            phone: data.phone,
          });
        }
      }
    } catch (err) {
      // Don't set user to null on error - keep the minimal data that was already set
    }
  }

  // Switch active role (for users with multiple roles)
  async function switchRole(newRole) {
    if (!supabase || !user) {
      throw new Error("Cannot switch role: not authenticated");
    }

    // Verify user has this role
    if (!user.roles.includes(newRole)) {
      throw new Error(`You don't have the ${newRole} role`);
    }

    try {
      // Update active_role in database
      const { error } = await supabase
        .from("profiles")
        .update({ active_role: newRole })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setUser(prev => ({
        ...prev,
        activeRole: newRole,
        role: newRole, // Keep legacy field in sync
      }));

      return true;
    } catch (err) {
      console.error("Error switching role:", err);
      throw err;
    }
  }

  // Add a new role to user's roles array
  async function addRole(newRole) {
    if (!supabase || !user) {
      throw new Error("Cannot add role: not authenticated");
    }

    if (!["student", "tutor"].includes(newRole)) {
      throw new Error("Invalid role");
    }

    // Handle undefined/null roles array - check both roles array and legacy role field
    const currentRoles = user.roles || [];
    const legacyRole = user.role;
    const allCurrentRoles = [...new Set([...currentRoles, legacyRole].filter(Boolean))];
    
    if (allCurrentRoles.includes(newRole)) {
      throw new Error(`You already have the ${newRole} role`);
    }

    try {
      // First, fetch current profile to get existing roles
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id, roles, role, name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileCheckError) {
        console.error("Error checking profile:", profileCheckError);
        throw new Error(`Failed to check profile: ${profileCheckError.message}`);
      }

      if (!existingProfile) {
        throw new Error("Profile not found. Please complete your profile setup first.");
      }

      // Build updated roles array from existing data
      const existingRolesArray = Array.isArray(existingProfile.roles) 
        ? existingProfile.roles 
        : (existingProfile.role ? [existingProfile.role] : []);
      
      // Check if role already exists
      if (existingRolesArray.includes(newRole)) {
        throw new Error(`You already have the ${newRole} role`);
      }

      const updatedRoles = [...existingRolesArray, newRole];
      
      // Update roles in database - use upsert to ensure profile exists
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          roles: updatedRoles,
          active_role: newRole // Switch to the new role
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      // Verify the update succeeded by fetching the profile again
      const { data: updatedProfile, error: verifyError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (verifyError || !updatedProfile) {
        throw new Error("Failed to verify profile update");
      }

      // If adding tutor role, create tutor_profiles row
      if (newRole === "tutor") {
        // Check if tutor_profiles row already exists
        const { data: existingTutorProfile, error: tutorCheckError } = await supabase
          .from("tutor_profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (tutorCheckError && tutorCheckError.code !== "PGRST116" && tutorCheckError.status !== 406) {
          console.error("Error checking tutor profile:", tutorCheckError);
          throw new Error(`Failed to check tutor profile: ${tutorCheckError.message}`);
        }

        // Only insert if it doesn't exist
        if (!existingTutorProfile) {
          const { error: tutorError } = await supabase
            .from("tutor_profiles")
            .insert({
              id: user.id,
              bio: "",
              subjects: [],
              availability: [],
            });

          if (tutorError) {
            console.error("Tutor profile creation error:", tutorError);
            // If insert fails, try to rollback the profile update
            try {
              await supabase
                .from("profiles")
                .update({ 
                  roles: existingRolesArray,
                  active_role: user.activeRole || existingRolesArray[0] || existingProfile.role
                })
                .eq("id", user.id);
            } catch (rollbackError) {
              console.error("Failed to rollback profile update:", rollbackError);
            }
            throw new Error(`Failed to create tutor profile: ${tutorError.message}`);
          }
        }
      }

      // Refresh profile to get latest data
      await loadUserProfile(user.id);

      return true;
    } catch (err) {
      console.error("Error adding role:", err);
      throw err;
    }
  }

  // Login with email and password
  async function login(email, password) {
    if (!supabase) {
      throw new Error("Supabase client not initialized. Please check your configuration.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle unverified email
      if (error.message.toLowerCase().includes("email") && 
          error.message.toLowerCase().includes("confirm")) {
        throw new Error("Please verify your email before logging in. Check your inbox.");
      }
      throw error;
    }

    // Session will be handled by onAuthStateChange
    return data;
  }

  // Register new user
  async function registerUser({ name, email, password, roles }) {
    if (!supabase) {
      throw new Error("Supabase client not initialized. Please check your configuration.");
    }

    // Validate email domain (Howard University)
    if (!email.toLowerCase().endsWith("@bison.howard.edu")) {
      throw new Error("Only @bison.howard.edu emails are allowed");
    }

    // Handle both old single-role and new multi-role registration
    // If 'roles' is not an array, treat it as a single role for backward compatibility
    let rolesArray = Array.isArray(roles) ? roles : [roles];
    
    // Validate roles
    if (rolesArray.length === 0) {
      throw new Error("Please select at least one role");
    }
    
    for (const role of rolesArray) {
      if (!["student", "tutor"].includes(role)) {
        throw new Error("Role must be 'student' or 'tutor'");
      }
    }

    // Use first role as the initial active role
    const activeRole = rolesArray[0];

    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        data: {
          name,
          roles: rolesArray,
          active_role: activeRole,
        },
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      // Provide more specific error messages
      if (authError.message?.includes('already registered')) {
        throw new Error("This email is already registered. Please log in instead.");
      } else if (authError.message?.includes('password')) {
        throw new Error("Password is too weak. Please use a stronger password.");
      } else if (authError.message?.includes('email')) {
        throw new Error("Invalid email address. Please check your email.");
      }
      throw new Error(authError.message || "Failed to create account. Please try again.");
    }

    // Check if user was created (not just a duplicate signup attempt)
    if (!authData.user) {
      throw new Error("Failed to create account. Please try again.");
    }

    // Wait a moment for the trigger to create the profile
    // The database trigger should automatically create the profile
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile was created by trigger, or create it manually as fallback
    const { data: existingProfile, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Trigger didn't create it, try manually
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          role: activeRole,
          roles: rolesArray,
          active_role: activeRole,
          name,
        });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't throw - user was created, they can complete profile later
      }
    }

    // If tutor role is selected, verify tutor_profiles exists
    if (rolesArray.includes("tutor")) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { data: existingTutorProfile } = await supabase
        .from("tutor_profiles")
        .select("id")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (!existingTutorProfile) {
        // Trigger didn't create it, try manually
        const { error: tutorError } = await supabase
          .from("tutor_profiles")
          .insert({
            id: authData.user.id,
          });

        if (tutorError && !tutorError.message?.includes('duplicate') && 
            !tutorError.code?.includes('23505')) {
          console.error("Tutor profile creation error:", tutorError);
        }
      }
    }

    // Return the auth data (user needs to verify email before they can log in)
    return authData;
  }

  // Logout
  async function logout() {
    // Immediately clear local state first (don't wait for Supabase)
    setUser(null);
    setSession(null);
    setToken(null);
    setLoading(false);
    
    // Then try to sign out from Supabase (with timeout)
    if (supabase) {
      try {
        // Add timeout to signOut call
        const signOutPromise = supabase.auth.signOut();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("SignOut timeout")), 2000)
        );
        
        await Promise.race([signOutPromise, timeoutPromise]);
      } catch (error) {
        // State is already cleared above, so we're good
      }
    }
  }

  // Refresh user profile (call after profile updates)
  async function refreshProfile() {
    if (session?.user?.id) {
      await loadUserProfile(session.user.id);
    }
  }

  // Reset password - send reset email
  async function resetPassword(email) {
    if (!supabase) {
      throw new Error("Supabase client not initialized. Please check your configuration.");
    }

    // Validate email domain (Howard University)
    if (!email.toLowerCase().endsWith("@bison.howard.edu")) {
      throw new Error("Only @bison.howard.edu emails are allowed");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      throw error;
    }

    return true;
  }

  // Update password - called after user clicks reset link
  async function updatePassword(newPassword) {
    if (!supabase) {
      throw new Error("Supabase client not initialized. Please check your configuration.");
    }

    // Validate password strength (same as registration)
    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if we have an active session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      throw new Error("Auth session missing! Please click the reset link from your email again.");
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw error;
    }

    // After successful password update, sign out the recovery session
    // Recovery sessions are temporary and user should log in with new password
    await supabase.auth.signOut();

    return true;
  }

  const value = { 
    user, 
    session,
    login, 
    registerUser, 
    logout, 
    loading,
    refreshProfile,
    switchRole,
    addRole,
    resetPassword,
    updatePassword,
  };
  
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
