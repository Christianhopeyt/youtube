'use strict';

const CD_STRINGS = {
  EN: {
    eyebrow:'Public YouTube data', title:'Creator Dashboard', subtitle:'Recent upload patterns, performance signals, and content ideas based on public channel data.',
    loading:'Building the Creator Dashboard from recent public videos...', error:'Creator Dashboard data is temporarily unavailable. The existing channel analysis remains available.',
    source:'Dashboard analytics use a sample of recent public YouTube uploads. They are not private YouTube Studio analytics.', stale:' Showing an older cached report.',
    tab_overview:'Overview', tab_videos:'Videos', tab_ideas:'Ideas', views_recent:'Views across recent uploads', upload_pattern:'Upload pattern', growth_velocity:'Growth velocity',
    score:'Channel score', avg_views:'Average views/video', engagement:'Average engagement', frequency:'Uploads/week', insufficient:'Insufficient public data',
    confidence:'confidence', best_day:'Best upload day', best_hour:'Best upload time', average_gap:'Average upload gap', utc:'UTC', days:'days',
    recent_avg:'Recent average views', older_avg:'Older average views', change:'Age-normalized change', growth:'Recent uploads are gaining views faster than the older comparison group.',
    decline:'Recent uploads are gaining views more slowly than the older comparison group.', stable:'Recent and older uploads are performing at a similar pace.', unavailable:'Not enough public uploads for a comparison.',
    top_videos_empty:'No recent public videos were available.', views:'views', likes:'likes', comments:'comments', published:'Published', compared:'sample pace',
    ai_notice:'Ideas and recommendations are Gemini-generated interpretations of the public metrics above.', ai_loading:'Generating recommendations and content ideas from the verified metrics...',
    ai_error:'AI ideas are temporarily unavailable. Public statistics are still valid.', chart_label:'Bar chart of views across recent public uploads.', summary:'Dashboard summary', recommendations:'Recommendations', video_ideas:'Video ideas', title_ideas:'Title ideas', angles:'Topic angles', tags:'Tags',
    subscribers:'Subscribers', total_views:'Total views', videos:'Videos', featured:'Top video',
    growth_chart:'Growth trend', growth_note:'Historical subscriber counts are not public, so growth is tracked with public view data.',
    share_btn:'Copy summary', print_btn:'Print / Save PDF', share_copied:'Summary copied to clipboard.', share_failed:'Copy failed. Select the text and copy manually.',
    compare:'Video comparison', compare_hint:'Click a column to sort.', table_title:'Title', table_published:'Published', table_views:'Views', table_views_day:'Views/day', table_engagement:'Engagement',
    share_header:'Norlytics Creator Dashboard'
  },
  FR: {
    eyebrow:'Données YouTube publiques', title:'Creator Dashboard', subtitle:'Tendances de publication, signaux de performance et idées de contenu basés sur les données publiques de la chaîne.',
    loading:'Création du Creator Dashboard à partir des vidéos publiques récentes...', error:'Les données du Creator Dashboard sont temporairement indisponibles. L’analyse de chaîne existante reste disponible.',
    source:'Les statistiques utilisent un échantillon de publications YouTube publiques récentes. Il ne s’agit pas de données privées de YouTube Studio.', stale:' Affichage d’un ancien rapport mis en cache.',
    tab_overview:'Vue d’ensemble', tab_videos:'Vidéos', tab_ideas:'Idées', views_recent:'Vues des publications récentes', upload_pattern:'Rythme de publication', growth_velocity:'Vitesse de croissance',
    score:'Score de chaîne', avg_views:'Vues moyennes/vidéo', engagement:'Engagement moyen', frequency:'Publications/semaine', insufficient:'Données publiques insuffisantes',
    confidence:'confiance', best_day:'Meilleur jour de publication', best_hour:'Meilleure heure de publication', average_gap:'Intervalle moyen', utc:'UTC', days:'jours',
    recent_avg:'Vues moyennes récentes', older_avg:'Vues moyennes précédentes', change:'Évolution normalisée selon l’âge', growth:'Les publications récentes gagnent des vues plus rapidement que le groupe précédent.',
    decline:'Les publications récentes gagnent des vues plus lentement que le groupe précédent.', stable:'Les publications récentes et précédentes progressent à un rythme similaire.', unavailable:'Pas assez de publications publiques pour effectuer une comparaison.',
    top_videos_empty:'Aucune vidéo publique récente disponible.', views:'vues', likes:'likes', comments:'commentaires', published:'Publiée', compared:'rythme de l’échantillon',
    ai_notice:'Les idées et recommandations sont des interprétations générées par Gemini à partir des statistiques publiques ci-dessus.', ai_loading:'Génération de recommandations et d’idées à partir des statistiques vérifiées...',
    ai_error:'Les idées IA sont temporairement indisponibles. Les statistiques publiques restent valides.', chart_label:'Graphique en barres des vues des publications publiques récentes.', summary:'Résumé du tableau de bord', recommendations:'Recommandations', video_ideas:'Idées de vidéos', title_ideas:'Idées de titres', angles:'Angles de sujets', tags:'Tags',
    subscribers:'Abonnés', total_views:'Vues totales', videos:'Vidéos', featured:'Vidéo phare',
    growth_chart:'Tendance de croissance', growth_note:'L’historique du nombre d’abonnés n’est pas public ; la croissance est donc suivie via les données publiques de vues.',
    share_btn:'Copier le résumé', print_btn:'Imprimer / Enregistrer en PDF', share_copied:'Résumé copié dans le presse-papiers.', share_failed:'Échec de la copie. Sélectionnez le texte et copiez-le manuellement.',
    compare:'Comparaison des vidéos', compare_hint:'Cliquez sur une colonne pour trier.', table_title:'Titre', table_published:'Publiée', table_views:'Vues', table_views_day:'Vues/jour', table_engagement:'Engagement',
    share_header:'Tableau de bord du créateur Norlytics'
  }
};

const CreatorDashboard = {
  report: null,
  parsed: null,
  ideasKey: null,
  ideasStatus: 'idle',
  ideasRequestToken: 0,
  ideasErrorKey: null,
  isDedicatedPage() { return Boolean(document.querySelector('.creator-page #creator-dashboard')); },
  lang() { return location.pathname === '/fr' || location.pathname.startsWith('/fr/') ? 'FR' : 'EN'; },
  text(key) { return CD_STRINGS[this.lang()]?.[key] || CD_STRINGS.EN[key] || key; },
  escape(value) { const div = document.createElement('div'); div.textContent = String(value ?? ''); return div.innerHTML; },
  number(value, digits = 0) {
    if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
    return new Intl.NumberFormat(this.lang() === 'FR' ? 'fr-FR' : 'en-US', { maximumFractionDigits: digits, notation: Number(value) >= 1000000 ? 'compact' : 'standard' }).format(value);
  },
  percent(value) { return Number.isFinite(Number(value)) ? `${this.number(value, 1)}%` : '—'; },
  init() {
    if (!this.isDedicatedPage()) return;
    document.querySelectorAll('[data-cd]').forEach(element => {
      const value = this.text(element.dataset.cd);
      if (value) element.textContent = value;
    });
    document.querySelectorAll('.creator-tabs button').forEach(button => {
      button.addEventListener('click', () => this.showTab(button.dataset.tab));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
        const tabs = [...document.querySelectorAll('.creator-tabs button')];
        const next = tabs[(tabs.indexOf(button) + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        this.showTab(next.dataset.tab);
      });
    });
    this.showTab('overview');
    const share = document.getElementById('creator-share-btn');
    if (share) share.addEventListener('click', () => this.shareReport());
    const print = document.getElementById('creator-print-btn');
    if (print) print.addEventListener('click', () => this.printReport());
  },
  showTab(tab) {
    document.querySelectorAll('.creator-tabs button').forEach(button => {
      const active = button.dataset.tab === tab;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('.creator-panel').forEach(panel => { panel.hidden = panel.id !== `creator-panel-${tab}`; });
    if (tab === 'ideas' && this.report && this.ideasStatus === 'idle') {
      this.ideasStatus = 'pending';
      this.loadIdeas(this.report.channel.id, this.ideasKey);
    }
  },
  async load(parsed) {
    if (!this.isDedicatedPage()) return;
    this.parsed = parsed;
    this.report = null;
    document.getElementById('creator-loading').style.display = 'flex';
    document.getElementById('creator-error').classList.remove('visible');
    document.getElementById('creator-content').hidden = true;
    document.getElementById('creator-source-notice').textContent = this.text('source');
    try {
      const response = await fetch(`/api/creator-dashboard?type=${encodeURIComponent(parsed.type)}&value=${encodeURIComponent(parsed.value)}`);
      const report = await response.json();
      if (!response.ok) throw new Error(report.error || this.text('error'));
      this.accept(report);
    } catch (_) {
      const error = document.getElementById('creator-error');
      error.textContent = this.text('error');
      error.classList.add('visible');
    } finally {
      document.getElementById('creator-loading').style.display = 'none';
    }
  },
  accept(report) {
    if (!this.isDedicatedPage()) return;
    const nextIdeasKey = `${report.channel.id}:${report.dashboard.sampledAt}:${this.lang()}`;
    const ideasChanged = this.ideasKey !== nextIdeasKey;
    if (ideasChanged) {
      this.ideasKey = nextIdeasKey;
      this.ideasStatus = 'idle';
      this.ideasErrorKey = null;
      this.ideasRequestToken += 1;
    }
    this.report = report;
    document.getElementById('creator-loading').style.display = 'none';
    document.getElementById('creator-error').classList.remove('visible');
    if (ideasChanged) document.getElementById('creator-ai-content').innerHTML = '';
    this.showTab('overview');
    this.render(report);
  },
  render(report) {
    const dashboard = report.dashboard;
    document.getElementById('creator-content').hidden = false;
    document.getElementById('creator-source-notice').textContent = this.text('source') + (report.source?.stale ? this.text('stale') : '');
    document.getElementById('creator-confidence').textContent = dashboard.score.confidence === 'insufficient'
      ? this.text('insufficient')
      : `${dashboard.score.confidence} ${this.text('confidence')}`;
    const score = dashboard.score.score === null ? this.text('insufficient') : `${dashboard.score.score}/100`;
    const metrics = [
      [this.text('score'), score],
      [this.text('avg_views'), this.number(dashboard.performance.averageViewsPerVideo)],
      [this.text('engagement'), this.percent(dashboard.performance.recent.averageEngagementRate)],
      [this.text('frequency'), this.number(dashboard.uploadPattern.uploadsPerWeek, 1)]
    ];
    document.getElementById('creator-metrics').innerHTML = metrics.map(([label,value]) =>
      `<article class="creator-metric"><div class="creator-metric-value">${this.escape(value)}</div><div class="creator-metric-label">${this.escape(label)}</div></article>`
    ).join('');
    this.renderChart(dashboard.recentVideos);
    this.renderPattern(dashboard.uploadPattern);
    this.renderGrowth(dashboard.performance);
    this.renderVideos(dashboard.topVideos);
    this.renderGrowthChart(dashboard.recentVideos);
    this.renderCompareTable(dashboard.recentVideos);
  },
  renderChart(videos) {
    const ordered = videos.slice(0, 15).reverse();
    const max = Math.max(1, ...ordered.map(video => video.views));
    const chart = document.getElementById('creator-video-chart');
    chart.setAttribute('role', 'img');
    chart.setAttribute('aria-label', this.text('chart_label'));
    chart.innerHTML = ordered.length
      ? ordered.map((video, index) => `<div class="creator-chart-bar" style="height:${Math.max(4, video.views / max * 155)}px" title="${this.escape(video.title)}: ${this.number(video.views)} ${this.text('views')}"><span>${index + 1}</span></div>`).join('')
      : `<div>${this.text('top_videos_empty')}</div>`;
  },
  renderPattern(pattern) {
    const days = this.lang() === 'FR' ? ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'] : ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const hour = pattern.bestUploadHourUtc === null ? '—' : `${String(pattern.bestUploadHourUtc).padStart(2,'0')}:00–${String(pattern.bestUploadHourUtc + 3).padStart(2,'0')}:59 ${this.text('utc')}`;
    const rows = [
      [this.text('best_day'), pattern.bestUploadDay === null ? '—' : days[pattern.bestUploadDay]],
      [this.text('best_hour'), hour],
      [this.text('average_gap'), Number.isFinite(pattern.averageDaysBetweenUploads) ? `${this.number(pattern.averageDaysBetweenUploads,1)} ${this.text('days')}` : '—']
    ];
    document.getElementById('creator-upload-pattern').innerHTML = `<div class="creator-pattern-list">${rows.map(([label,value]) => `<div class="creator-pattern-row"><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>`).join('')}</div>`;
  },
  renderGrowth(performance) {
    const explanation = this.text(performance.direction);
    const rows = [
      [this.text('recent_avg'), this.number(performance.recent.averageViews)],
      [this.text('older_avg'), this.number(performance.older.averageViews)],
      [this.text('change'), this.percent(performance.growthPercent)]
    ];
    document.getElementById('creator-growth').innerHTML = `<div class="creator-growth-box">${rows.map(([label,value]) => `<div class="creator-growth-stat"><strong>${this.escape(value)}</strong><span>${this.escape(label)}</span></div>`).join('')}</div><p style="color:var(--text-3);font-size:.82rem;line-height:1.6;margin-top:14px;">${this.escape(explanation)}</p>`;
  },
  renderVideos(videos) {
    document.getElementById('creator-top-videos').innerHTML = videos.length ? videos.map(video => {
      const ratio = Number.isFinite(video.performanceRatio) ? `${this.number(video.performanceRatio, 1)}× ${this.text('compared')}` : '—';
      const date = new Date(video.publishedAt).toLocaleDateString(this.lang() === 'FR' ? 'fr-FR' : 'en-US', { year:'numeric', month:'short', day:'numeric' });
      return `<a class="creator-video-item" href="${this.escape(video.url)}" target="_blank" rel="noopener"><img src="${this.escape(video.thumbnail)}" alt="" loading="lazy"><div><div class="creator-video-title">${this.escape(video.title)}</div><div class="creator-video-meta"><span>${this.number(video.views)} ${this.text('views')}</span><span>${this.number(video.likes)} ${this.text('likes')}</span><span>${this.number(video.comments)} ${this.text('comments')}</span><span>${this.text('published')} ${this.escape(date)}</span></div><span class="creator-performance">${this.escape(ratio)}</span></div></a>`;
    }).join('') : `<div class="creator-card">${this.text('top_videos_empty')}</div>`;
  },
  renderGrowthChart(videos) {
    const container = document.getElementById('creator-growth-chart');
    if (!container) return;
    const buckets = new Map();
    videos.forEach(video => {
      const date = new Date(video.publishedMs);
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
      date.setUTCHours(0, 0, 0, 0);
      const key = date.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) || 0) + video.views);
    });
    const weeks = [...buckets.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
    const max = Math.max(1, ...weeks.map(([, views]) => views));
    container.setAttribute('role', 'img');
    container.setAttribute('aria-label', this.text('growth_chart'));
    container.innerHTML = weeks.length
      ? weeks.map(([key, views]) => {
        const label = new Date(key).toLocaleDateString(this.lang() === 'FR' ? 'fr-FR' : 'en-US', { month:'short', day:'numeric' });
        return `<div class="creator-chart-bar" style="height:${Math.max(4, views / max * 150)}px" title="${label}: ${this.number(views)} ${this.text('views')}"><span>${this.escape(label)}</span></div>`;
      }).join('')
      : `<div>${this.text('top_videos_empty')}</div>`;
  },
  renderCompareTable(videos) {
    const wrap = document.getElementById('creator-compare-wrap');
    if (!wrap) return;
    const sortKey = this.compareSortKey || 'viewsPerDay';
    const sortDir = this.compareSortDir || 'desc';
    const ordered = videos.slice().sort((a, b) => {
      if (sortKey === 'title') return sortDir === 'asc' ? String(a.title).localeCompare(String(b.title)) : String(b.title).localeCompare(String(a.title));
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av > bv ? -1 : 1);
    });
    const th = (key, label) => {
      const active = sortKey === key;
      return `<th data-sort="${key}" aria-sort="${active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}"><button type="button">${this.escape(label)}${active ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}</button></th>`;
    };
    const rows = ordered.map(video => {
      const date = new Date(video.publishedAt).toLocaleDateString(this.lang() === 'FR' ? 'fr-FR' : 'en-US', { year:'numeric', month:'short', day:'numeric' });
      return `<tr><td class="creator-compare-title"><a href="${this.escape(video.url)}" target="_blank" rel="noopener">${this.escape(video.title)}</a></td><td>${this.escape(date)}</td><td>${this.number(video.views)}</td><td>${this.number(video.viewsPerDay, 1)}</td><td>${this.percent(video.engagementRate)}</td></tr>`;
    }).join('');
    wrap.innerHTML = `<div class="creator-compare-head"><h3>${this.escape(this.text('compare'))}</h3><span>${this.escape(this.text('compare_hint'))}</span></div><div class="creator-table-scroll"><table class="creator-compare-table"><thead><tr>${th('title', this.text('table_title'))}${th('publishedAt', this.text('table_published'))}${th('views', this.text('table_views'))}${th('viewsPerDay', this.text('table_views_day'))}${th('engagementRate', this.text('table_engagement'))}</tr></thead><tbody>${rows}</tbody></table></div>`;
    wrap.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (this.compareSortKey === key) this.compareSortDir = this.compareSortDir === 'asc' ? 'desc' : 'asc';
        else { this.compareSortKey = key; this.compareSortDir = key === 'title' ? 'asc' : 'desc'; }
        this.renderCompareTable(videos);
      });
    });
  },
  reportText() {
    const report = this.report;
    if (!report) return '';
    const channel = report.channel;
    const dashboard = report.dashboard;
    const channelUrl = channel.handle ? `https://www.youtube.com/@${channel.handle}` : `https://www.youtube.com/channel/${channel.id}`;
    const subscribers = channel.hiddenSubscriberCount ? this.text('hidden') : this.number(channel.subscriberCount);
    const score = dashboard.score.score === null ? this.text('insufficient') : `${dashboard.score.score}/100 (${dashboard.score.confidence})`;
    const top = dashboard.topVideos[0];
    const lines = [
      this.text('share_header'),
      '',
      `${channel.title} (${channel.handle || channel.id})`,
      `${this.text('subscribers')}: ${subscribers} | ${this.text('total_views')}: ${this.number(channel.viewCount)} | ${this.text('videos')}: ${this.number(channel.videoCount)}`,
      `${this.text('score')}: ${score}`,
      `${this.text('avg_views')}: ${this.number(dashboard.performance.averageViewsPerVideo)} | ${this.text('engagement')}: ${this.percent(dashboard.performance.recent.averageEngagementRate)} | ${this.text('frequency')}: ${this.number(dashboard.uploadPattern.uploadsPerWeek, 1)}`,
      `${this.text('change')}: ${this.percent(dashboard.performance.growthPercent)}`,
      top ? `${this.text('featured')}: ${top.title} (${this.number(top.views)} ${this.text('views')})` : '',
      channelUrl
    ].filter(Boolean);
    return lines.join('\n');
  },
  shareReport() {
    const button = document.getElementById('creator-share-btn');
    if (!button || !this.report) return;
    const restore = () => { button.textContent = this.text('share_btn'); button.disabled = false; };
    const feedback = ok => { button.textContent = this.text(ok ? 'share_copied' : 'share_failed'); setTimeout(restore, 2200); };
    const text = this.reportText();
    button.disabled = true;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => feedback(true)).catch(() => feedback(false));
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (_) {}
      document.body.removeChild(textarea);
      feedback(ok);
    }
  },
  printReport() {
    if (!this.report) return;
    this.showTab('overview');
    setTimeout(() => window.print(), 150);
  },
  ideasMetrics(report) {
    const dashboard = report.dashboard;
    const compactVideo = video => ({
      title: video.title,
      views: video.views,
      viewsPerDay: video.viewsPerDay,
      engagementRate: video.engagementRate,
      publishedAt: video.publishedAt
    });
    return {
      channel: {
        id: report.channel.id,
        title: report.channel.title,
        description: report.channel.description
      },
      dashboard: {
        sampledAt: dashboard.sampledAt,
        sampleSize: dashboard.sampleSize,
        score: dashboard.score,
        uploadPattern: dashboard.uploadPattern,
        performance: dashboard.performance,
        commonKeywords: dashboard.commonKeywords,
        topVideos: dashboard.topVideos.slice(0, 6).map(compactVideo)
      }
    };
  },
  showIdeasError(container, requestKey) {
    if (this.ideasErrorKey === requestKey) return;
    this.ideasErrorKey = requestKey;
    this.ideasStatus = 'error';
    container.classList.remove('is-loading');
    container.classList.add('is-error');
    container.innerHTML = `<div class="creator-card creator-ai-state is-error"><span class="ui-state-mark" aria-hidden="true"></span><span>${this.escape(this.text('ai_error'))}</span></div>`;
  },
  async loadIdeas(channelId, requestKey) {
    const container = document.getElementById('creator-ai-content');
    if (!this.isDedicatedPage() || !container || requestKey !== this.ideasKey) return;
    const requestToken = ++this.ideasRequestToken;
    container.classList.remove('is-error');
    container.classList.add('is-loading');
    container.innerHTML = `<div class="creator-card creator-ai-state"><span class="ui-state-mark" aria-hidden="true"></span><span>${this.escape(this.text('ai_loading'))}</span></div>`;
    try {
      const response = await fetch('/api/creator-dashboard-ai', {
        method:'POST',
        headers:{ 'content-type':'application/json' },
        body:JSON.stringify({
          channelId,
          language:this.lang() === 'FR' ? 'fr' : 'en',
          metrics:this.ideasMetrics(this.report)
        })
      });
      const data = response.headers.get('content-type')?.includes('application/json') ? await response.json() : {};
      if (!response.ok || !data.suggestions) throw new Error();
      if (requestToken !== this.ideasRequestToken || requestKey !== this.ideasKey) return;
      this.ideasStatus = 'success';
      container.classList.remove('is-loading', 'is-error');
      this.renderIdeas(data.suggestions);
    } catch (_) {
      if (requestToken !== this.ideasRequestToken || requestKey !== this.ideasKey) return;
      this.showIdeasError(container, requestKey);
    }
  },
  renderIdeas(ai) {
    document.getElementById('creator-ai-content').classList.remove('is-loading', 'is-error');
    const list = (key, items) => `<section class="creator-ai-group"><h3>${this.escape(this.text(key))}</h3>${items.map(item => `<div class="creator-ai-item">${this.escape(item)}</div>`).join('')}</section>`;
    document.getElementById('creator-ai-content').innerHTML =
      `<section class="creator-ai-group"><h3>${this.escape(this.text('summary'))}</h3><p>${this.escape(ai.summary)}</p></section>` +
      list('recommendations', ai.recommendations) + list('video_ideas', ai.videoIdeas) +
      list('title_ideas', ai.titleIdeas) + list('angles', ai.topicAngles) + list('tags', ai.tags);
  }
};

window.CreatorDashboard = CreatorDashboard;
document.addEventListener('DOMContentLoaded', () => CreatorDashboard.init());
