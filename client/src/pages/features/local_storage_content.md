# Local Storage: Your Data Stays on Your Device

At Chofesh, we believe that your data is your property. That's why we've built our platform on a local-first architecture, ensuring that your conversations, files, and preferences are stored directly on your device, not on our servers. This fundamental design choice is at the heart of our commitment to your privacy and security.

## How Local Storage Works

Our local storage implementation is simple, transparent, and secure:

*   **Browser-Based Storage:** We utilize your browser's built-in storage capabilities (IndexedDB and localStorage) to store all your data. This means your data is sandboxed within your browser and is not accessible to other websites or applications.
*   **No Server-Side Copies:** We do not create any copies of your data on our servers. When you use Chofesh, you are interacting directly with a local application running in your browser.
*   **Complete User Control:** You have complete control over your data. You can export your data at any time, and if you clear your browser's cache, your data will be permanently deleted.

## Why It Matters

Local storage is a critical component of our privacy-first approach. Here's why it's so important:

*   **Data Sovereignty:** You are the sole owner of your data. You decide where it's stored, who has access to it, and when it's deleted.
*   **Enhanced Security:** By keeping your data on your device, we eliminate the risk of server-side data breaches. Even if our servers were compromised, your data would remain safe.
*   **Offline Access:** Because your data is stored locally, you can access your conversations and notes even when you're not connected to the internet. (Note: AI model access requires an internet connection).
*   **Peace of Mind:** With local storage, you can use Chofesh with the confidence that your sensitive information is not being collected, analyzed, or monetized.

## Frequently Asked Questions (FAQ)

**1. What data is stored locally?**

All your chat history, uploaded files, user preferences, and API keys are stored locally in your browser.

**2. Is my locally stored data encrypted?**

Yes. In addition to being stored locally, your data is also end-to-end encrypted with AES-256 encryption.

**3. What are the downsides of local storage?**

The main downside is that your data is tied to a single device and browser. We are actively working on a privacy-preserving solution for multi-device sync.

**4. How much data can I store locally?**

The amount of data you can store is limited by your browser's storage capacity, which is typically several gigabytes. This is more than enough for most users.

**5. Can I back up my data?**

Yes. We provide an option to export your data as a JSON file, which you can then store in a secure location.

## Related Features

*   **[Private AI Chat](/features/private-ai-chat):** Learn how local storage is a key component of our private chat feature.
*   **[Bring Your Own Key (BYOK)](/features/byok):** Your API keys are also stored locally for maximum security.
*   **[Pricing](/pricing):** Our pricing model is based on the value we provide, not on monetizing your data.
