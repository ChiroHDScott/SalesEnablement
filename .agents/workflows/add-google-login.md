---
description: Add Client-Side Google Login to HTML pages
---

This workflow explains how to add a client-side Google Login requirement to newly created HTML pages. It should **not** be applied to existing pages.

When a new HTML file is created that needs generic protection to ensure the user is part of the `@chirohd.com` domain, follow these steps:

1. **Add the Google Identity Services Library**: Add the following script tag to the `<head>` of the HTML file. 
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

2. **Add the Login Container**: Add a placeholder for the Google Sign-In button right after the `<body>` tag.
```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID_HERE"
     data-context="signin"
     data-ux_mode="popup"
     data-callback="handleCredentialResponse"
     data-auto_prompt="false"
     data-hosted_domain="chirohd.com">
</div>
<div id="login-container" style="display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f4f6;">
    <div style="text-align: center;">
        <h2>ChiroHD Internal Access</h2>
        <p>Please log in with your @chirohd.com account to view this page.</p>
        <div class="g_id_signin" data-type="standard" data-size="large" data-theme="outline" data-text="sign_in_with" data-shape="rectangular" data-logo_alignment="left"></div>
    </div>
</div>
```

3. **Wrap the Main Content**: Wrap all the actual sensitive content of the page in a container with the `id="protected-content"` and set it to be hidden initially.
```html
<div id="protected-content" style="display: none;">
    <!-- ALL PAGE CONTENT GOES HERE -->
</div>
```

4. **Add the Authentication Logic**: Add a `<script>` tag at the bottom of the `<body>` to handle the Google response and reveal the content upon successful authentication.
```html
<script>
    function parseJwt(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    function handleCredentialResponse(response) {
        const payload = parseJwt(response.credential);
        
        // Ensure the email belongs to the correct domain
        if (payload.email && payload.email.endsWith('@chirohd.com')) {
            // Hide login, show content
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('protected-content').style.display = 'block';
        } else {
            alert('Access Denied. You must use a @chirohd.com account.');
        }
    }
</script>
```

> **Note**: You will need to replace `YOUR_GOOGLE_CLIENT_ID_HERE` with an actual Google OAuth 2.0 Client ID configured in the Google Cloud Console.
