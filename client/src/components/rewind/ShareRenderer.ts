import type { RewindData } from './types';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

function getRiderTitle(data: RewindData): string {
    const totalDays = data.totalDays;
    const streakDays = data.longestStreak.days;
    const coldestTemp = data.coldestDay?.tempLow ?? 50;
    const powderSnow = data.bestPowderDay?.snowfall ?? 0;
    const goalMet = data.goalProgress.met;

    if (goalMet) return 'Goal Crusher';

    const dayScore = totalDays >= 40 ? 3 : totalDays >= 25 ? 2 : totalDays >= 15 ? 1 : 0;
    const streakScore = streakDays >= 4 ? 3 : streakDays >= 3 ? 2 : streakDays >= 2 ? 1 : 0;
    const coldScore = coldestTemp <= 0 ? 3 : coldestTemp <= 10 ? 2 : coldestTemp <= 20 ? 1 : 0;
    const powderScore = powderSnow >= 6 ? 3 : powderSnow >= 3 ? 2 : powderSnow >= 1 ? 1 : 0;

    const traits = [
        { score: dayScore, title: 'Hill Addict' },
        { score: streakScore, title: 'Streak Master' },
        { score: coldScore, title: 'Ice Rider' },
        { score: powderScore, title: 'Powder Hound' },
    ];

    const dominant = traits.sort((a, b) => b.score - a.score)[0];
    if (dominant.score === 0) return 'Rising Rider';
    return dominant.title;
}

/**
 * Renders the Season Rewind summary as a beautiful canvas image
 * optimized for phone screens and social media stories.
 */
export async function renderShareImage(data: RewindData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // ── Background gradient ──────────────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    bgGrad.addColorStop(0, '#0f0c29');
    bgGrad.addColorStop(0.4, '#302b63');
    bgGrad.addColorStop(0.7, '#24243e');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // ── Load logo ────────────────────────────────────────────────────────
    const logo = await loadImage('/logo.png');

    // ── Decorative elements ──────────────────────────────────────────────
    const glow = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, 420, 0,
        CANVAS_WIDTH / 2, 420, 350
    );
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.10)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 100, CANVAS_WIDTH, 700);

    // Scattered snowflakes
    ctx.font = '24px serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const snowPositions = [
        [80, 200], [950, 350], [150, 900], [900, 1100], [100, 1400],
        [800, 1600], [500, 150], [700, 750], [200, 1200], [850, 1800],
        [400, 1650], [650, 1350], [300, 400], [750, 550],
    ];
    for (const [x, y] of snowPositions) {
        ctx.fillText('❄', x, y);
    }

    // ── Header ───────────────────────────────────────────────────────────
    ctx.textAlign = 'center';

    // "Your" label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '300 22px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('YOUR', CANVAS_WIDTH / 2, 180);
    ctx.letterSpacing = '0px';

    // "Season Rewind" title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
    ctx.fillText('Season Rewind', CANVAS_WIDTH / 2, 260);

    // Season name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '300 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(data.season.name, CANVAS_WIDTH / 2, 310);

    // ── Rider Title (replaces Season Score) ───────────────────────────────
    const riderTitle = getRiderTitle(data);
    const cx = CANVAS_WIDTH / 2;

    // App logo
    if (logo) {
        const logoSize = 160;
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
        ctx.shadowBlur = 40;
        ctx.drawImage(logo, cx - logoSize / 2, 340, logoSize, logoSize);
        ctx.restore();
    }

    // Rider title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(riderTitle, cx, 550);

    // Decorative line under title
    const lineY = 595;
    const lineGrad1 = ctx.createLinearGradient(cx - 150, lineY, cx + 150, lineY);
    lineGrad1.addColorStop(0, 'rgba(251,191,36,0)');
    lineGrad1.addColorStop(0.5, 'rgba(251,191,36,0.3)');
    lineGrad1.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.strokeStyle = lineGrad1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 150, lineY);
    ctx.lineTo(cx + 150, lineY);
    ctx.stroke();

    // ── Stats grid ────────────────────────────────────────────────────────
    const stats = buildStatsList(data);
    const gridTop = 650;
    const cardWidth = 460;
    const cardHeight = 130;
    const gap = 24;
    const gridLeft = (CANVAS_WIDTH - cardWidth * 2 - gap) / 2;

    for (let i = 0; i < stats.length; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = gridLeft + col * (cardWidth + gap);
        const y = gridTop + row * (cardHeight + gap);

        // Card background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        roundRect(ctx, x, y, cardWidth, cardHeight, 20);
        ctx.fill();

        // Accent bar at top
        ctx.fillStyle = stats[i].accentColor || 'rgba(255,255,255,0.15)';
        roundRect(ctx, x, y, cardWidth, 3, 20);
        ctx.fill();

        // Icon — use logo for Hill Days card, emoji for others
        if (stats[i].label === 'Total Hill Days' && logo) {
            ctx.drawImage(logo, x + 20, y + 28, 36, 36);
        } else {
            ctx.font = '36px serif';
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(stats[i].icon, x + 24, y + 55);
        }

        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillText(stats[i].value, x + 80, y + 55);

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '300 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(stats[i].label, x + 80, y + 95);
    }

    // ── Date range ────────────────────────────────────────────────────────
    const dateY = gridTop + Math.ceil(stats.length / 2) * (cardHeight + gap) + 20;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = '300 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(
        `${formatDate(data.firstDay)}  →  ${formatDate(data.lastDay)}`,
        CANVAS_WIDTH / 2,
        dateY
    );

    // ── Divider line ──────────────────────────────────────────────────────
    const divY = dateY + 40;
    const lineGrad = ctx.createLinearGradient(200, divY, CANVAS_WIDTH - 200, divY);
    lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, divY);
    ctx.lineTo(CANVAS_WIDTH - 200, divY);
    ctx.stroke();

    // ── Footer branding ───────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '300 22px system-ui, -apple-system, sans-serif';
    ctx.fillText('Hill Days  ·  Season Rewind', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.font = '300 18px system-ui, -apple-system, sans-serif';
    ctx.fillText('See you next season! ❄️', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);

    // ── Export to blob ────────────────────────────────────────────────────
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
            'image/png',
            1.0
        );
    });
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}


function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface StatItem {
    icon: string;
    value: string;
    label: string;
    accentColor?: string;
}

function buildStatsList(data: RewindData): StatItem[] {
    const stats: StatItem[] = [
        { icon: '🗓️', value: `${data.totalDays} days`, label: 'Total Hill Days', accentColor: 'rgba(129,140,248,0.5)' },
        { icon: '🏔️', value: data.favoriteHill.hill, label: `${data.favoriteHill.count} visits`, accentColor: 'rgba(52,211,153,0.5)' },
        { icon: '🔥', value: `${data.longestStreak.days} days`, label: 'Longest Streak', accentColor: 'rgba(251,146,60,0.5)' },
        { icon: '📅', value: `${data.favoriteDayOfWeek.day}s`, label: 'Favorite Day', accentColor: 'rgba(167,139,250,0.5)' },
    ];

    if (data.coldestDay) {
        stats.push({ icon: '🥶', value: `${data.coldestDay.tempLow}°F`, label: 'Coldest Ride', accentColor: 'rgba(148,163,184,0.5)' });
    }

    if (data.bestPowderDay) {
        stats.push({ icon: '🌨️', value: `${data.bestPowderDay.snowfall}"`, label: 'Best Powder Day', accentColor: 'rgba(226,232,240,0.5)' });
    }

    // Ensure even number for 2-column grid
    if (stats.length % 2 !== 0) {
        stats.push({ icon: '📊', value: `${data.avgDaysPerWeek}/wk`, label: 'Avg Rate', accentColor: 'rgba(251,191,36,0.5)' });
    }

    return stats;
}

/**
 * Trigger download of the share image, or use native share if available with file support.
 */
export async function downloadShareImage(data: RewindData): Promise<void> {
    const blob = await renderShareImage(data);
    const file = new File([blob], 'season-rewind.png', { type: 'image/png' });

    // Try native share with file (mobile)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
            await navigator.share({
                title: 'My Season Rewind',
                text: `🏂 ${getRiderTitle(data)} — ${data.totalDays} hill days this season!`,
                files: [file],
            });
            return;
        } catch {
            // User cancelled or share failed, fall through to download
        }
    }

    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'season-rewind.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
