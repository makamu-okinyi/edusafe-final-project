// post.js
document.addEventListener('DOMContentLoaded', () => {
    const backendUrl = 'https://edusafe-final-project-backed-production.up.railway.app';

    // Get post ID from URL
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
        window.location.href = 'forum.html'; // Redirect if no ID
        return;
    }

    const postTitle = document.getElementById('post-title');
    const postDate = document.getElementById('post-date');
    const postBody = document.getElementById('post-body');
    const replyListContainer = document.getElementById('reply-list-container');
    const newReplyForm = document.getElementById('new-reply-form');

    // Function to load the single post and its replies
    async function loadPostDetails() {
        try {
            const response = await fetch(`${backendUrl}/api/forum/${postId}/`);
            if (!response.ok) {
                throw new Error('Failed to load post');
            }
            const post = await response.json();

            postTitle.textContent = post.title;
            postDate.textContent = `Posted on: ${new Date(post.created_at).toLocaleString()}`;
            postBody.textContent = post.body;

            replyListContainer.innerHTML = '';
            if (post.replies.length === 0) {
                replyListContainer.innerHTML = '<p>No replies yet. Be the first!</p>';
            }

            post.replies.forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'forum-reply-item';
                replyDiv.innerHTML = `
                    <p>${reply.body}</p>
                    <small>Posted on: ${new Date(reply.created_at).toLocaleString()}</small>
                `;
                replyListContainer.appendChild(replyDiv);
            });

        } catch (error) {
            console.error('Error loading post:', error);
            postTitle.textContent = 'Error';
            postBody.textContent = `Could not load this post: ${error.message || 'Network error'}. Please check your connection and try again.`;
        }
    }

    // Handle new reply submission
    newReplyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = document.getElementById('reply-body').value.trim();

        if (!body) {
            alert('Please write a reply.');
            return;
        }

        try {
            const response = await fetch(`${backendUrl}/api/forum/${postId}/reply/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body })
            });

            if (response.ok) {
                document.getElementById('reply-body').value = '';
                loadPostDetails(); // Refresh the replies
            } else {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.detail || errorData.message || 'An error occurred. Your reply could not be saved.';
                alert(errorMsg);
            }
        } catch (error) {
            console.error('Error creating reply:', error);
            const errorMsg = error.message || 'A network error occurred. Please check your connection and try again.';
            alert(errorMsg);
        }
    });

    // Initial load
    loadPostDetails();
});