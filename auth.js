document.addEventListener("DOMContentLoaded", () => {
    const year = document.getElementById("year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    const authStatus = document.getElementById("auth-status");
    const signoutButton = document.getElementById("signout-btn");
    const googleButton = document.getElementById("google-login");
    const microsoftButton = document.getElementById("microsoft-login");

    const SUPABASE_URL = "https://sigfvxturvfqgnukrxbn.supabase.co";
    const SUPABASE_ANON_KEY = "sb_publishable_UTdM0gqiIMhkEBcZLnyFEA_6bQuLkpS";
    const redirectUrl = `${window.location.origin}/index.html`;

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const showStatus = (text) => {
        if (authStatus) {
            authStatus.textContent = text;
        }
    };

    const toggleAuthState = (session) => {
        if (!session) {
            showStatus("Your account is not connected yet.");
            signoutButton?.classList.add("auth-hidden");
            return;
        }

        const providerName = session.user?.app_metadata?.provider || "account";
        const displayName = session.user?.user_metadata?.full_name || session.user?.email || "Player";

        showStatus(`Signed in as ${displayName} via ${providerName}.`);
        signoutButton?.classList.remove("auth-hidden");
    };

    supabase.auth.getSession().then(({ data }) => {
        toggleAuthState(data.session);
    });

    supabase.auth.onAuthStateChange((event, session) => {
        toggleAuthState(session);
    });

    googleButton?.addEventListener("click", async () => {
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

    signoutButton?.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            showStatus("Your account is not connected yet.");
            signoutButton.classList.add("auth-hidden");
        } else {
            showStatus(`Sign out failed: ${error.message}`);
        }
    });
});