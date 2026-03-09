import type { RewindData } from './types';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

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

    // ── Decorative elements ──────────────────────────────────────────────
    // Subtle radial glow behind score
    const glow = ctx.createRadialGradient(
        CANVAS_WIDTH / 2, 480, 0,
        CANVAS_WIDTH / 2, 480, 350
    );
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
    glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 130, CANVAS_WIDTH, 700);

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

    // ── Season Score (hero element) ───────────────────────────────────────
    // Score ring
    const cx = CANVAS_WIDTH / 2;
    const cy = 500;
    const radius = 130;

    // Ring track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Ring progress
    const pct = Math.min(data.seasonScore / 100, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';

    // Score number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(data.seasonScore), cx, cy - 8);

    // "/ 100" label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '300 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('/ 100', cx, cy + 45);
    ctx.textBaseline = 'alphabetic';

    // Score label
    const scoreLabel = getScoreLabel(data.seasonScore);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(scoreLabel, cx, cy + radius + 50);

    // ── Stats grid ────────────────────────────────────────────────────────
    const stats = buildStatsList(data);
    const gridTop = 740;
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

        // Emoji
        ctx.font = '36px serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stats[i].icon, x + 24, y + 50);

        // Value
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillText(stats[i].value, x + 80, y + 50);

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '300 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(stats[i].label, x + 80, y + 90);
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

function getScoreLabel(score: number): string {
    if (score >= 90) return '🏆 Legendary Season';
    if (score >= 75) return '⭐ Epic Season';
    if (score >= 60) return '🎿 Solid Season';
    if (score >= 40) return '💪 Getting There';
    return '🌱 Just Getting Started';
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface StatItem {
    icon: string;
    value: string;
    label: string;
}

function buildStatsList(data: RewindData): StatItem[] {
    const stats: StatItem[] = [
        { icon: '🎿', value: `${data.totalDays} days`, label: 'Total Hill Days' },
        { icon: '🏔️', value: data.favoriteHill.hill, label: `${data.favoriteHill.count} visits` },
        { icon: '🔥', value: `${data.longestStreak.weeks} weeks`, label: 'Longest Streak' },
        { icon: '📅', value: `${data.favoriteDayOfWeek.day}s`, label: 'Favorite Day' },
    ];

    if (data.coldestDay) {
        stats.push({ icon: '🥶', value: `${data.coldestDay.tempLow}°F`, label: 'Coldest Ride' });
    }

    if (data.bestPowderDay) {
        stats.push({ icon: '🌨️', value: `${data.bestPowderDay.snowfall}"`, label: 'Best Powder Day' });
    }

    // Ensure even number for 2-column grid
    if (stats.length % 2 !== 0) {
        stats.push({ icon: '📊', value: `${data.avgDaysPerWeek}/wk`, label: 'Avg Rate' });
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
                text: `🎿 Season Score: ${data.seasonScore}/100 — ${data.totalDays} hill days this season!`,
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
