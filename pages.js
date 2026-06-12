(() => {
  const api = window.quizShared;
  if (!api) return;

  const { allQuestions, getAnswerText, getChapter, percent, questionBank } = api;
  const progress = api.loadProgress();
  const page = document.body.dataset.page;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  }

  function getOverview() {
    const stats = Object.values(progress.stats || {});
    const answered = stats.length;
    const correct = stats.filter((item) => item.lastCorrect).length;
    return {
      answered,
      correct,
      mistakes: Object.keys(progress.mistakes || {}).length,
      total: allQuestions.length,
    };
  }

  function renderOverview() {
    const overview = getOverview();
    setText("#totalQuestions", overview.total);
    setText("#answeredQuestions", overview.answered);
    setText("#accuracyRate", percent(overview.correct, overview.answered));
    setText("#mistakeCount", overview.mistakes);
  }

  function getChapterStats(chapter) {
    const ids = chapter.questions.map((question) => question.id);
    const practiced = ids.filter((id) => progress.stats?.[id]).length;
    const correct = ids.filter((id) => progress.stats?.[id]?.lastCorrect).length;
    const mistakes = ids.filter((id) => progress.mistakes?.[id]).length;
    return {
      correct,
      mistakes,
      practiced,
      rate: percent(correct, practiced),
      total: chapter.questions.length,
    };
  }

  function renderChapterCards(selector, chapters = questionBank) {
    const container = document.querySelector(selector);
    if (!container) return;

    container.innerHTML = chapters
      .map((chapter) => {
        const stats = getChapterStats(chapter);
        const width = Math.round((stats.practiced / stats.total) * 100);
        const link = `practice.html?mode=chapter&chapter=${encodeURIComponent(chapter.id)}`;
        return `
          <a class="chapter-card" href="${link}">
            <div>
              <span class="mode-label">${stats.total} 题</span>
              <h3>${escapeHtml(chapter.shortTitle)}</h3>
              <p>${escapeHtml(chapter.title)}</p>
            </div>
            <div class="mini-progress" aria-hidden="true"><span style="width: ${width}%"></span></div>
            <small>${stats.practiced}/${stats.total} 已练 · 正确率 ${stats.rate}</small>
          </a>
        `;
      })
      .join("");
  }

  function renderReviewList(selector, source, mode) {
    const container = document.querySelector(selector);
    if (!container) return;

    const questionIds = Object.keys(source || {});
    const questions = questionIds
      .map((id) => allQuestions.find((question) => question.id === id))
      .filter(Boolean);

    if (!questions.length) {
      container.innerHTML = `
        <div class="empty-state">
          当前还没有题目。完成练习后，这里会自动整理需要复习的内容。
        </div>
      `;
      return;
    }

    const link = `practice.html?mode=${mode}`;
    container.innerHTML = questions
      .map((question) => {
        const chapter = getChapter(question.chapterId);
        return `
          <a class="review-item" href="${link}">
            <span>${escapeHtml(chapter.shortTitle)}</span>
            <h3>${escapeHtml(question.text)}</h3>
            <p>正确答案：${escapeHtml(getAnswerText(question))}</p>
          </a>
        `;
      })
      .join("");
  }

  function renderChapterStats() {
    const container = document.querySelector("#chapterStats");
    if (!container) return;

    container.innerHTML = questionBank
      .map((chapter) => {
        const stats = getChapterStats(chapter);
        const width = Math.round((stats.practiced / stats.total) * 100);
        return `
          <a class="stats-row" href="practice.html?mode=chapter&chapter=${encodeURIComponent(chapter.id)}">
            <div>
              <strong>${escapeHtml(chapter.shortTitle)}</strong>
              <span>${stats.practiced}/${stats.total} 已练 · 错题 ${stats.mistakes}</span>
            </div>
            <div class="stats-progress" aria-hidden="true"><span style="width: ${width}%"></span></div>
            <b>${stats.rate}</b>
          </a>
        `;
      })
      .join("");
  }

  renderOverview();

  if (page === "home") {
    renderChapterCards("#chapterPreview", questionBank.slice(0, 6));
  }

  if (page === "chapters") {
    renderChapterCards("#chapterCards");
  }

  if (page === "review") {
    renderReviewList("#mistakeList", progress.mistakes, "mistakes");
    renderReviewList("#favoriteList", progress.favorites, "favorites");
  }

  if (page === "stats") {
    renderChapterStats();
  }
})();
