// Modal logic and post creation for Garden Journal

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

  openBtn.onclick = () => { modal.style.display = 'flex'; };
  closeBtn.onclick = () => { modal.style.display = 'none'; };
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  postForm.onsubmit = function (e) {
    e.preventDefault();
    const title = document.getElementById('postTitle').value.trim();
    const summary = document.getElementById('postSummary').value.trim();
    const tags = document.getElementById('postTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const author = getCurrentUser();
    const date = formatDate(new Date());

    // Create card
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
      ${tags.map(tag => `<span class="tag" style="background:${tagColors[Math.floor(Math.random()*tagColors.length)]};">${'#'+tag}</span>`).join(' ')}
      <div class="card-footer">
        <button class="read-more">Read More</button>
      </div>
    `;
    postList.prepend(card);

    this.reset();
    modal.style.display = 'none';
  };
});