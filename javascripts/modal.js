// Modal logic and post creation for Garden Journal

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api/journal'
  : 'https://nyaoha.onrender.com/api/journal';

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('writePostModal');
  const openBtn = document.querySelector('.write-post');
  const closeBtn = document.getElementById('closeModalBtn');
  const postForm = document.getElementById('postForm');
  const postList = document.querySelector('.post-list');
  const sortDropdown = document.getElementById('journalSortDropdown');

  // Tag color cycle (use more colors for variety)
  const tagColors = ['#4F7E24', '#36C9C6', '#ED6A5A', '#CCDBBF', '#959595'];

  function getCurrentUser() {
    return window.currentUserName || localStorage.getItem('username') || 'Anonymous';
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  openBtn.onclick = () => { modal.style.display = 'flex'; };
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  // Fetch all posts
  async function fetchPosts() {
    try {
      const res = await fetch(API_URL);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  }

  // Create a new post
  async function createPost(post) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    return res.ok ? await res.json() : null;
  }

  // Delete a post by ID
  async function deletePost(id) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  }

  // Render all posts from backend, sorted
  async function renderPosts() {
    postList.innerHTML = '';
    let posts = await fetchPosts();
    const currentUser = getCurrentUser();
    // Sort posts based on dropdown
    const sortValue = sortDropdown.value;
    if (sortValue === 'author') {
      posts.sort((a, b) => (a.author || '').localeCompare(b.author || ''));
    } else if (sortValue === 'date') {
      posts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
    }
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

  // Listen for sort changes
  sortDropdown.addEventListener('change', renderPosts);
});