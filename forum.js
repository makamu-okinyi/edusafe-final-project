// forum.js
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'https://edusafe-final-project-backed-production.up.railway.app';
    const postListContainer = document.getElementById('post-list-container');
    const newPostForm = document.getElementById('new-post-form');

    // Function to load all posts
    async function loadPosts() {
        try {
            const response = await fetch(`${backendUrl}/api/forum/`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Server error: ${response.status}`);
            }
            const posts = await response.json();

            postListContainer.innerHTML = ''; // Clear "Loading..."
            if (posts.length === 0) {
                postListContainer.innerHTML = '<p>No discussions yet. Be the first to start one!</p>';
                return;
            }

            posts.forEach(post => {
                const postDiv = document.createElement('div');
                postDiv.className = 'forum-post-item';
                postDiv.innerHTML = `
                    <h4><a href="post.html?id=${post.id}">${post.title}</a></h4>
                    <small>Posted on: ${new Date(post.created_at).toLocaleDateString()} | ${post.reply_count} replies</small>
                `;
                postListContainer.appendChild(postDiv);
            });

        } catch (error) {
            console.error('Error loading posts:', error);
            postListContainer.innerHTML = '<p style="color: red;">Could not load discussions. Please check your connection and try again later.</p>';
        }
    }

    // Function to handle new post submission
    newPostForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('post-title').value.trim();
        const body = document.getElementById('post-body').value.trim();

        if (!title || !body) {
            alert('Please fill out both the title and body.');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/forum/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body })
            });

            if (response.ok) {
                newPostForm.reset();
                loadPosts(); // Refresh the list
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.detail || errorData.message || 'An error occurred. Your post could not be saved.';
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            const errorMsg = error.message || 'A network error occurred. Please check your connection and try again.';
            alert(errorMsg);
        }
    });

    // Initial load
    loadPosts();
});