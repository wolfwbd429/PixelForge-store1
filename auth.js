document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const authStatus = document.getElementById("auth-status");
    const signoutButton = document.getElementById("signout-btn");
    const googleButton = document.getElementById("google-login");
    const microsoftButton = document.getElementById("microsoft-login");
    
    // Phone interface DOM elements
    const phoneInput = document.getElementById("phone-input");
    const sendOtpButton = document.getElementById("send-otp-btn");
    const otpContainer = document.getElementById("otp-container");
    const otpInput = document.getElementById("otp-input");
    const verifyOtpButton = document.getElementById("verify-otp-btn");

    // 👥 New Player Profile DOM Elements
    const profileContainer = document.getElementById("profile-container");
    const usernameInput = document.getElementById("username-input");
    const saveProfileButton = document.getElementById("save-profile-btn");

    const SUPABASE_URL = "https://supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_UTdM0gqiIMhkEBcZLnyFEA_6bQuLkpS";
    
    // Dynamically routes back to your active environment (Localhost or live Render domain)
    const redirectUrl = `${window.location.origin}/index.html`;

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const showStatus = (text) => {
        if (authStatus) {
            authStatus.textContent = text;
        }
    };

    // 🔄 Unified Authentication and Database Profile Sync
    const toggleAuthState = async (session) => {
        if (!session) {
            showStatus("Your account is not connected yet.");
            signoutButton?.classList.add("auth-hidden");
            profileContainer?.classList.add("auth-hidden");
            localStorage.removeItem("pixel_forge_username"); // Clear local trace
            return;
        }

        const user = session.user;
        signoutButton?.classList.remove("auth-hidden");
        profileContainer?.classList.remove("auth-hidden");

        showStatus("Loading player profile matrix...");

        // 🔍 Fetch custom player details from the Supabase public profiles table
        let { data: profile, error } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', user.id)
            .maybeSingle(); // Gracefully handles if row does not exist yet

        let activeDisplayName = "Player";
        if (profile && profile.username) {
            activeDisplayName = profile.username;
            if (usernameInput) usernameInput.value = profile.username; // Pre-fill text field
            localStorage.setItem("pixel_forge_username", profile.username); // Pass profile to shop chat
        } else {
            // Fallbacks if username hasn't been set yet
            activeDisplayName = user.user_metadata?.full_name || user.phone || user.email || "Player";
            localStorage.removeItem("pixel_forge_username");
        }

        const providerName = user.app_metadata?.provider || "account";
        showStatus(`Signed in as ${activeDisplayName} via ${providerName}.`);
    };

    supabase.auth.getSession().then(({ data }) => {
        toggleAuthState(data.session);
    });

    supabase.auth.onAuthStateChange((event, session) => {
        toggleAuthState(session);
    });

    // 💾 Save or Update Username Row inside Supabase Table
    saveProfileButton?.addEventListener("click", async () => {
        const sessionData = await supabase.auth.getSession();
        const user = sessionData.data.session?.user;
        
        if (!user) {
            showStatus("Error: No authenticated user session found.");
            return;
        }

        const typedUsername = usernameInput?.value.trim();
        if (!typedUsername || typedUsername.length  {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: redirectUrl,
            },
        });

        if (error) {
            showStatus(`Google login failed: ${error.message}`);
        }
    });

    microsoftButton?.addEventListener("click", async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "azure",
            options: {
                redirectTo: redirectUrl,
            },
        });

        if (error) {
            showStatus(`Microsoft login failed: ${error.message}`);
        }
    });

    // 📱 Step 1: Request SMS Verification Code
    sendOtpButton?.addEventListener("click", async () => {
        const phoneNumber = phoneInput?.value.trim();
        if (!phoneNumber) {
            showStatus("Please enter a valid phone number.");
            return;
        }

        showStatus("Sending text message verification code...");
        const { error } = await supabase.auth.signInWithOtp({
            phone: phoneNumber,
        });

        if (error) {
            showStatus(`SMS delivery failed: ${error.message}`);
        } else {
            showStatus("Verification code sent! Check your device.");
            otpContainer?.classList.remove("auth-hidden"); 
        }
    });

    // 📱 Step 2: Confirm 6-Digit SMS Token
    verifyOtpButton?.addEventListener("click", async () => {
        const phoneNumber = phoneInput?.value.trim();
        const codeToken = otpInput?.value.trim();

        if (!codeToken) {
            showStatus("Please enter the 6-digit verification code.");
            return;
        }

        showStatus("Checking your code...");
        const { data, error } = await supabase.auth.verifyOtp({
            phone: phoneNumber,
            token: codeToken,
            type: 'sms'
        });

        if (error) {
            showStatus(`Verification failed: ${error.message}`);
        } else if (data.session) {
            showStatus("Login successful! Redirecting...");
            window.location.href = "index.html";
        }
    });

    signoutButton?.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            showStatus("Your account is not connected yet.");
            signoutButton.classList.add("auth-hidden");
            otpContainer?.classList.add("auth-hidden");
            profileContainer?.classList.add("auth-hidden");
            localStorage.removeItem("pixel_forge_username");
        } else {
            showStatus(`Sign out failed: ${error.message}`);
        }
    });
});
