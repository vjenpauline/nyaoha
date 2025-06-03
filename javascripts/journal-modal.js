// Journal modal logic and MongoDB integration for Garden Journal

const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api/journal'
  : 'https://nyaoha.onrender.com/api/journal';

document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('writePostModal');
  const openBtn = document.querySelector('.write-post');
  const closeBtn = document.getElementById('closeModalBtn');
  const postForm = document.getElementById('postForm');
  const postList = document.querySelector('.post-list');

  // Tag color cycle
  const tagColors = ['#7dd181', '#f7b267', '#f4845f', '#4f98ca', '#a28089', '#e07a5f', '#81b29a', '#f2cc8f'];

  // Get username from auth (fallback to 'Anonymous')
  function getCurrentUser() {
    return window.currentUserName || localStorage.getItem('username') || 'Anonymous';
  }

  // Format date as "Month Day, Year"
  function formatDate(date) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Render a post card
  function renderPost({ title, summary, tags, author, date }) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar"></div>
        <div class="user-info">
          <p class="author">${author}</p>
          <p class="date">${date}</p>
        </div>
      </div>
      <h3 class="post-title">${title}</h3>
      <p class="post-summary">${summary}</p>
      ${tags && tags.length ? tags.map(tag => `<span class="tag" style="background:${tagColors[Math.floor(Math.random()*tagColors.length)]};">#${tag}</span>`).join(' ') : ''}
      <div class="card-footer">
        <button class="read-more">Read More</button>
      </div>
    `;
    postList.prepend(card);
  }

  // Fetch and display all posts
  async function loadPosts() {
    try {
      const res = await fetch(API_URL);
      const posts = await res.json();
      postList.innerHTML = '';
      posts.forEach(renderPost);
    } catch (err) {
      postList.innerHTML = '<p style="color:red">Failed to load posts.</p>';
    }
  }

  openBtn.onclick = () => { modal.style.display = 'flex'; };
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  postForm.onsubmit = async function (e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const summary = document.getElementById('postSummary').value.trim();
    const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const author = getCurrentUser();
    const date = formatDate(new Date());

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, summary, tags, author, date })
      });
      if (!res.ok) throw new Error('Failed to save post');
      const post = await res.json();
      renderPost(post);
      this.reset();
      modal.style.display = 'none';
    } catch (err) {
      alert('Failed to save post.');
    }
  };

  // Initial load
  loadPosts();
});
