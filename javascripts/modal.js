// Modal logic and post creation for Garden Journal

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('writePostModal');
  const openBtn = document.querySelector('.write-post');
  const closeBtn = document.getElementById('closeModalBtn');
  const postForm = document.getElementById('postForm');
  const postList = document.querySelector('.post-list');

  // Tag color cycle
  const tagColors = ['#4F7E24', '#36C9C6', '#ED6A5A', '#CCDBBF', '#959595', '#e07a5f'];

  // Get username from auth (fallback to 'Anonymous')
  function getCurrentUser() {
    return window.currentUserName || localStorage.getItem('username') || 'Anonymous';
  }

  // Format date as "Month Day, Year"
  function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  openBtn.onclick = () => { modal.style.display = 'flex'; };
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  // Helper: Fetch posts from backend
  async function fetchPosts() {
    const res = await fetch('/api/journal');
    return res.ok ? await res.json() : [];
  }

  // Helper: Post a new journal entry
  async function createPost(post) {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    return res.ok ? await res.json() : null;
  }

  // Helper: Delete a post by ID
  async function deletePost(id) {
    await fetch(`/api/journal/${id}`, { method: 'DELETE' });
  }

  // Helper: Render all posts from backend
  async function renderPosts() {
    postList.innerHTML = '';
    const posts = await fetchPosts();
    const currentUser = getCurrentUser();
    posts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <div class="avatar"></div>
          <div class="user-info">
            <p class="author">${post.author}</p>
            <p class="date">${post.date}</p>
          </div>
        </div>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-summary">${post.summary}</p>
        ${(post.tags || []).map((tag, i) => `<span class=\"tag\" style=\"background:${tagColors[i % tagColors.length]};\">#${tag}</span>`).join(' ')}
        ${post.author === currentUser ? `
          <div class=\"card-footer\">
            <button class=\"delete-post\" data-id=\"${post._id}\">Delete</button>
          </div>
        ` : ''}
      `;
      postList.appendChild(card);
    });
    // Attach delete listeners
    document.querySelectorAll('.delete-post').forEach(btn => {
      btn.onclick = async function() {
        const id = this.getAttribute('data-id');
        await deletePost(id);
        renderPosts();
      };
    });
  }

  // On page load, render posts from backend
  renderPosts();

  postForm.onsubmit = async function (e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const summary = document.getElementById('postSummary').value.trim();
    const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const author = getCurrentUser();
    const date = formatDate(new Date());

    await createPost({ title, summary, tags, author, date });
    renderPosts();
    this.reset();
    modal.style.display = 'none';
  };
});