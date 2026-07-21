// Zeus Insurance — OKX Fund Pitch Deck Generator
// Run: node scripts/generate-pitch-deck.js

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'Zeus_Insurance_Pitch_Deck.pdf');

// ── Palette ──────────────────────────────────────────────────────────────────
const BG       = '#080c14';   // deep navy
const GOLD     = '#F5A623';   // primary / Zeus lightning
const WHITE    = '#FFFFFF';
const WHITE60  = '#99A8BF';   // muted text
const WHITE15  = '#1E2B3D';   // card surface
const WHITE08  = '#111820';   // slightly elevated
const GREEN    = '#22C55E';
const RED      = '#EF4444';

const W = 841.89;  // A4 landscape width  (pts)
const H = 595.28;  // A4 landscape height

// ── Helpers ──────────────────────────────────────────────────────────────────
function slide(doc, drawFn) {
  drawFn(doc);
  doc.addPage();
}

function bg(doc, color = BG) {
  doc.rect(0, 0, W, H).fill(color);
}

function grid(doc) {
  doc.save();
  doc.opacity(0.025);
  const step = 45;
  doc.strokeColor(GOLD).lineWidth(0.5);
  for (let x = 0; x < W; x += step) doc.moveTo(x, 0).lineTo(x, H).stroke();
  for (let y = 0; y < H; y += step) doc.moveTo(0, y).lineTo(W, y).stroke();
  doc.restore();
}

// Zeus shield SVG-style drawn with pdfkit primitives
function zeusShield(doc, x, y, size = 80) {
  const s = size / 80;
  doc.save();
  doc.translate(x, y);

  // Shield body (pentagon-ish)
  doc.save();
  doc.strokeColor(GOLD).lineWidth(2.5 * s).fillColor('#0f1623');
  doc.moveTo(40 * s, 2 * s)
    .lineTo(78 * s, 10 * s)
    .lineTo(78 * s, 28 * s)
    .bezierCurveTo(78 * s, 46 * s, 62 * s, 58 * s, 40 * s, 64 * s)
    .bezierCurveTo(18 * s, 58 * s, 2 * s, 46 * s, 2 * s, 28 * s)
    .lineTo(2 * s, 10 * s)
    .closePath()
    .fillAndStroke();
  doc.restore();

  // Inner glow
  doc.save();
  doc.opacity(0.07).fillColor(GOLD);
  doc.moveTo(40 * s, 7 * s)
    .lineTo(72 * s, 14 * s)
    .lineTo(72 * s, 28 * s)
    .bezierCurveTo(72 * s, 43 * s, 58 * s, 54 * s, 40 * s, 59 * s)
    .bezierCurveTo(22 * s, 54 * s, 8 * s, 43 * s, 8 * s, 28 * s)
    .lineTo(8 * s, 14 * s)
    .closePath()
    .fill();
  doc.restore();

  // Lightning bolt Z-shape
  doc.save();
  doc.fillColor(GOLD).strokeColor(GOLD).lineWidth(0.5 * s);
  doc.moveTo(48 * s, 13 * s)
    .lineTo(30 * s, 13 * s)
    .lineTo(26 * s, 31 * s)
    .lineTo(38 * s, 31 * s)
    .lineTo(32 * s, 50 * s)
    .lineTo(54 * s, 27 * s)
    .lineTo(42 * s, 27 * s)
    .closePath()
    .fillAndStroke();
  doc.restore();

  doc.restore();
}

function goldBar(doc, x, y, w, h = 3) {
  doc.rect(x, y, w, h).fill(GOLD);
}

function chip(doc, x, y, label, value, sub, chipW = 160) {
  doc.roundedRect(x, y, chipW, 72, 8).fill(WHITE15);
  doc.roundedRect(x, y, chipW, 72, 8).stroke(WHITE08);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text(label.toUpperCase(), x + 14, y + 12, { width: chipW - 20 });
  doc.fontSize(20).fillColor(GOLD).font('Helvetica-Bold').text(value, x + 14, y + 26, { width: chipW - 20 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text(sub, x + 14, y + 52, { width: chipW - 20 });
}

function card(doc, x, y, w, h, opts = {}) {
  const { fill = WHITE15, stroke = WHITE08, radius = 10 } = opts;
  doc.roundedRect(x, y, w, h, radius).fill(fill);
  if (stroke) doc.roundedRect(x, y, w, h, radius).stroke(stroke);
}

function badge(doc, x, y, text, color = GOLD) {
  const tw = doc.widthOfString(text, { fontSize: 8 }) + 24;
  doc.roundedRect(x, y, tw, 22, 11)
    .fill(color + '1A')
    .stroke(color + '50');
  doc.fontSize(8).fillColor(color).font('Helvetica-Bold')
    .text(text, x + 12, y + 7, { width: tw - 20, lineBreak: false });
  return tw;
}

function bullet(doc, x, y, icon, text, color = WHITE) {
  doc.fontSize(14).text(icon, x, y - 2);
  doc.fontSize(11).fillColor(color).font('Helvetica').text(text, x + 26, y, { width: 240, lineBreak: false });
}

// ── SLIDE 1 — Title ──────────────────────────────────────────────────────────
function slide1(doc) {
  bg(doc);
  grid(doc);

  // Left gold accent bar
  doc.rect(0, 0, 5, H).fill(GOLD);

  // Glow behind shield
  doc.save();
  doc.circle(W / 2, H / 2, 160).fill(GOLD + '0D');
  doc.circle(W / 2, H / 2, 100).fill(GOLD + '18');
  doc.restore();

  // Shield — centered, large
  zeusShield(doc, W / 2 - 90, H / 2 - 120, 180);

  // ZEUS wordmark
  doc.fontSize(52).fillColor(GOLD).font('Helvetica-Bold')
    .text('ZEUS', 0, H / 2 + 75, { align: 'center', width: W });

  // Main title
  doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold')
    .text('Insurance Protocol', 0, H / 2 + 132, { align: 'center', width: W });

  // Subtitle
  doc.fontSize(14).fillColor(WHITE60).font('Helvetica')
    .text('Trust Layer for the Agentic Economy', 0, H / 2 + 162, { align: 'center', width: W });

  // Gold divider
  goldBar(doc, W / 2 - 100, H / 2 + 195, 200);

  // Bottom tagline
  doc.fontSize(11).fillColor(WHITE60).font('Helvetica')
    .text('Decentralized insurance and escrow for AI agents.', 0, H / 2 + 210, { align: 'center', width: W });

  // Bottom: X Layer + OKX badge
  badge(doc, 36, H - 50, '● X Layer Mainnet · Chain 196', GREEN);
  badge(doc, 260, H - 50, 'OKX Fund Round 1', GOLD);

  // Top-right small logo repeat
  zeusShield(doc, W - 60, 10, 42);
}

// ── SLIDE 2 — Problem & Solution ─────────────────────────────────────────────
function slide2(doc) {
  bg(doc);
  grid(doc);
  doc.rect(0, 0, 5, H).fill(GOLD);

  // Header
  badge(doc, 36, 30, 'THE PROBLEM & SOLUTION');
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold')
    .text('AI Agents Lose Millions on', 36, 62, { width: W - 72 });
  doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold')
    .text('Failed API Calls.', 36, 96, { width: W - 72 });
  goldBar(doc, 36, 133, 420, 2);

  // Two columns
  const colW = (W - 72 - 32) / 2;
  const leftX = 36;
  const rightX = leftX + colW + 32;
  const topY = 150;

  // LEFT — Problem card
  card(doc, leftX, topY, colW, H - topY - 50, { fill: RED + '0D', stroke: RED + '30' });
  doc.fontSize(13).fillColor(RED).font('Helvetica-Bold')
    .text('⚠  The Problem', leftX + 20, topY + 20);
  goldBar(doc, leftX + 20, topY + 42, 60, 2);

  const problems = [
    ['💸', 'API doesn\'t respond → funds already debited.'],
    ['⏳', 'Refunds require trust and take days.'],
    ['🧩', 'No standard way to insure a transaction.'],
    ['🤖', 'AI agents operate autonomously — no human recourse.'],
    ['📉', 'Every failed call = lost revenue for the agent.'],
  ];
  problems.forEach(([icon, text], i) => {
    bullet(doc, leftX + 20, topY + 60 + i * 52, icon, text, '#FFAAAA');
  });

  // RIGHT — Solution card
  card(doc, rightX, topY, colW, H - topY - 50, { fill: GOLD + '0D', stroke: GOLD + '30' });
  doc.fontSize(13).fillColor(GOLD).font('Helvetica-Bold')
    .text('⚡  The Zeus Solution', rightX + 20, topY + 20);
  goldBar(doc, rightX + 20, topY + 42, 60, 2);

  const solutions = [
    ['🛡️', 'Automatic insurance & escrow on-chain.'],
    ['⚡', 'Instant payouts from the reserve fund.'],
    ['🔌', 'Integrate in 3 steps via SDK or REST API.'],
    ['🤖', 'Fully autonomous — agents need no human.'],
    ['🔒', 'Non-custodial, trustless, fully auditable.'],
  ];
  solutions.forEach(([icon, text], i) => {
    bullet(doc, rightX + 20, topY + 60 + i * 52, icon, text, '#FFE0A0');
  });

  // Footer
  zeusShield(doc, W - 60, H - 56, 38);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica')
    .text('Zeus Insurance Protocol  ·  OKX Fund Pitch', 36, H - 28, { width: W - 120 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica')
    .text('2 / 6', W - 60, H - 28, { width: 40, align: 'right' });
}

// ── SLIDE 3 — How It Works ────────────────────────────────────────────────────
function slide3(doc) {
  bg(doc);
  grid(doc);
  doc.rect(0, 0, 5, H).fill(GOLD);

  badge(doc, 36, 30, 'HOW IT WORKS');
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold')
    .text('Automatic Protection', 36, 62, { width: 480 });
  doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold')
    .text('in Action.', 36, 96, { width: 480 });
  goldBar(doc, 36, 133, 300, 2);

  // Flow cards
  const flowY = 160;
  const cardW = 195;
  const gap = 44;
  const totalW = 3 * cardW + 2 * gap;
  const startX = (W - totalW) / 2;

  const steps = [
    { icon: '💳', label: 'AGENT PAYS', value: '$1.00', sub: 'via x402 protocol', color: GOLD, bg: GOLD + '18' },
    { icon: '⚡', label: 'API FAILS',  value: 'Detected', sub: 'on-chain oracle',  color: RED,  bg: RED  + '18' },
    { icon: '🛡️', label: 'ZEUS REFUNDS', value: '$0.93', sub: 'in ~5 seconds',  color: GREEN, bg: GREEN + '18' },
  ];

  steps.forEach((s, i) => {
    const cx = startX + i * (cardW + gap);
    // Card
    doc.roundedRect(cx, flowY, cardW, 175, 12).fill(s.bg);
    doc.roundedRect(cx, flowY, cardW, 175, 12).stroke(s.color + '60');
    // Icon
    doc.fontSize(36).text(s.icon, cx, flowY + 20, { width: cardW, align: 'center' });
    // Label
    doc.fontSize(9).fillColor(s.color).font('Helvetica-Bold')
      .text(s.label, cx + 10, flowY + 70, { width: cardW - 20, align: 'center' });
    // Value
    doc.fontSize(28).fillColor(s.color).font('Helvetica-Bold')
      .text(s.value, cx + 10, flowY + 88, { width: cardW - 20, align: 'center' });
    // Sub
    doc.fontSize(9).fillColor(WHITE60).font('Helvetica')
      .text(s.sub, cx + 10, flowY + 130, { width: cardW - 20, align: 'center' });

    // Arrow
    if (i < 2) {
      const ax = cx + cardW + 8;
      const ay = flowY + 87;
      doc.save();
      doc.strokeColor(WHITE60).lineWidth(1.5)
        .moveTo(ax, ay).lineTo(ax + gap - 16, ay).stroke();
      // arrowhead
      doc.fillColor(WHITE60)
        .moveTo(ax + gap - 16, ay - 5)
        .lineTo(ax + gap - 8, ay)
        .lineTo(ax + gap - 16, ay + 5)
        .fill();
      doc.restore();
    }
  });

  // Detail breakdown
  const bY = flowY + 195;
  card(doc, startX, bY, totalW, 100, { fill: WHITE08, stroke: WHITE15 });

  const details = [
    { label: 'Premium paid', value: '$0.07', note: '7% of insured amount' },
    { label: 'Amount insured', value: '$1.00', note: 'USDC on X Layer' },
    { label: 'Refund received', value: '$0.93', note: 'Net of premium · ~5 sec' },
  ];
  const detW = totalW / 3;
  details.forEach((d, i) => {
    const dx = startX + i * detW;
    if (i > 0) doc.save().strokeColor(WHITE15).lineWidth(1).moveTo(dx, bY + 16).lineTo(dx, bY + 84).stroke().restore();
    doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text(d.label.toUpperCase(), dx, bY + 16, { width: detW, align: 'center' });
    doc.fontSize(22).fillColor(WHITE).font('Helvetica-Bold').text(d.value, dx, bY + 36, { width: detW, align: 'center' });
    doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text(d.note, dx, bY + 68, { width: detW, align: 'center' });
  });

  // Tagline
  doc.fontSize(11).fillColor(WHITE60).font('Helvetica')
    .text('"Agent pays $1.00. API fails. Zeus automatically refunds $0.93 to the agent\'s wallet."',
      36, H - 52, { width: W - 72, align: 'center' });

  zeusShield(doc, W - 60, H - 56, 38);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('Zeus Insurance Protocol  ·  OKX Fund Pitch', 36, H - 28, { width: W - 120 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('3 / 6', W - 60, H - 28, { width: 40, align: 'right' });
}

// ── SLIDE 4 — Products ────────────────────────────────────────────────────────
function slide4(doc) {
  bg(doc);
  grid(doc);
  doc.rect(0, 0, 5, H).fill(GOLD);

  badge(doc, 36, 30, 'OUR PRODUCTS');
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold').text('Two Products,', 36, 62, { width: 480 });
  doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold').text('One Trust Layer.', 36, 96, { width: 480 });
  goldBar(doc, 36, 133, 300, 2);

  const topY = 152;
  const colW = (W - 72 - 24) / 2;
  const lX = 36;
  const rX = lX + colW + 24;
  const cH = H - topY - 46;

  // ── LEFT: Escrow ──
  card(doc, lX, topY, colW, cH, { fill: WHITE15, stroke: WHITE08 });
  badge(doc, lX + 16, topY + 16, 'MODEL A — ESCROW');
  doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold').text('Protected Transaction', lX + 16, topY + 48, { width: colW - 32 });
  goldBar(doc, lX + 16, topY + 74, 80, 2);

  const escrowItems = [
    ['💰', 'Funds locked until delivery is confirmed.'],
    ['🔒', '0.7% + $0.02 flat fee per transaction.'],
    ['🛡️', 'Full deposit refund on timeout.'],
    ['⚡', 'Automated release via on-chain oracle.'],
    ['🔍', 'Full audit trail on X Layer Mainnet.'],
  ];
  escrowItems.forEach(([icon, text], i) => {
    doc.fontSize(13).text(icon, lX + 16, topY + 90 + i * 46);
    doc.fontSize(10).fillColor(WHITE60).font('Helvetica').text(text, lX + 44, topY + 92 + i * 46, { width: colW - 60 });
  });

  // Commission badge
  doc.roundedRect(lX + 16, topY + cH - 62, colW - 32, 44, 8).fill(GOLD + '1A').stroke(GOLD + '40');
  doc.fontSize(11).fillColor(GOLD).font('Helvetica-Bold')
    .text('Commission: 0.7% + $0.02 per tx  ·  Non-custodial', lX + 24, topY + cH - 46, { width: colW - 48 });

  // ── RIGHT: Insurance ──
  card(doc, rX, topY, colW, cH, { fill: WHITE15, stroke: WHITE08 });
  badge(doc, rX + 16, topY + 16, 'MODEL B — INSURANCE', GOLD);
  doc.fontSize(16).fillColor(WHITE).font('Helvetica-Bold').text('Smart Coverage Suite', rX + 16, topY + 48, { width: colW - 32 });
  goldBar(doc, rX + 16, topY + 74, 80, 2);

  const insGroups = [
    { title: 'All-inclusive Insurance', color: GOLD, items: [
      'Covers API failures, network errors, wallet limits, gas failures, MCP errors.',
      'Dynamic premium based on Risk Score.',
      'Instant payouts from reserve.',
    ]},
    { title: 'Arbitration Risk', color: '#60A5FA', items: [
      'Protection against incorrect OKX AI arbitration decisions.',
      'Rate: 8% of dispute amount.',
    ]},
    { title: 'Slashing Protection', color: GREEN, items: [
      'Compensation for validator slashing.',
      'Protection for stakers and node operators.',
    ]},
  ];

  let iy = topY + 88;
  insGroups.forEach(({ title, color, items }) => {
    doc.fontSize(11).fillColor(color).font('Helvetica-Bold').text('▸  ' + title, rX + 16, iy, { width: colW - 32 });
    iy += 18;
    items.forEach(item => {
      doc.fontSize(9).fillColor(WHITE60).font('Helvetica').text('  · ' + item, rX + 20, iy, { width: colW - 36 });
      iy += 13 + (item.length > 60 ? 11 : 0);
    });
    iy += 8;
  });

  // Premium note
  doc.roundedRect(rX + 16, topY + cH - 62, colW - 32, 44, 8).fill(GREEN + '1A').stroke(GREEN + '40');
  doc.fontSize(11).fillColor(GREEN).font('Helvetica-Bold')
    .text('Premium from 7%  ·  Dynamic Risk Score  ·  Auto-payout', rX + 24, topY + cH - 46, { width: colW - 48 });

  zeusShield(doc, W - 60, H - 56, 38);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('Zeus Insurance Protocol  ·  OKX Fund Pitch', 36, H - 28, { width: W - 120 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('4 / 6', W - 60, H - 28, { width: 40, align: 'right' });
}

// ── SLIDE 5 — Tech & Integration ─────────────────────────────────────────────
function slide5(doc) {
  bg(doc);
  grid(doc);
  doc.rect(0, 0, 5, H).fill(GOLD);

  badge(doc, 36, 30, 'TECHNOLOGY & INTEGRATION');
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold').text('Built for the', 36, 62, { width: 480 });
  doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold').text('Agent Economy.', 36, 96, { width: 480 });
  goldBar(doc, 36, 133, 280, 2);

  // 4 big tech cards
  const cards = [
    { icon: '🔗', color: '#60A5FA', title: 'X Layer Mainnet', sub: 'Chain 196 (OKX L2)', detail: 'Our primary deployment network.\nFast, cheap, EVM-compatible.\nLive and audited.' },
    { icon: '🤖', color: GOLD, title: 'OKX AI Agent Marketplace', sub: 'ASP #7202', detail: 'Listed agent service provider.\nAgents discover & pay Zeus\nvia native OKX AI flows.' },
    { icon: '⚡', color: GREEN, title: 'x402 Protocol', sub: 'HTTP-native payments', detail: 'Agents pay per call with USDC.\nNo accounts, no approvals.\nFully autonomous M2M.' },
    { icon: '🔌', color: '#C084FC', title: 'MCP Server', sub: '7 AI tools available', detail: 'Plug Zeus into any agent:\nget-quote, buy-policy,\nclaim-policy, escrow + more.' },
  ];

  const cW = (W - 72 - 3 * 16) / 4;
  const cY = 152;
  const cH = 220;

  cards.forEach((c, i) => {
    const cx = 36 + i * (cW + 16);
    card(doc, cx, cY, cW, cH, { fill: WHITE15, stroke: c.color + '40' });
    // color top accent
    doc.rect(cx, cY, cW, 4).fill(c.color);
    doc.fontSize(30).text(c.icon, cx, cY + 18, { width: cW, align: 'center' });
    doc.fontSize(12).fillColor(WHITE).font('Helvetica-Bold').text(c.title, cx + 10, cY + 62, { width: cW - 20, align: 'center' });
    doc.fontSize(9).fillColor(c.color).font('Helvetica-Bold').text(c.sub, cx + 10, cY + 80, { width: cW - 20, align: 'center' });
    goldBar(doc, cx + cW / 2 - 30, cY + 97, 60, 1);
    doc.fontSize(9).fillColor(WHITE60).font('Helvetica').text(c.detail, cx + 12, cY + 108, { width: cW - 24, align: 'center', lineGap: 2 });
  });

  // Stack row
  const stackY = 392;
  card(doc, 36, stackY, W - 72, 80, { fill: WHITE08, stroke: WHITE15 });
  doc.fontSize(10).fillColor(WHITE60).font('Helvetica-Bold').text('TECH STACK', 56, stackY + 14);
  const stack = ['Solidity 0.8.27', 'OpenZeppelin v5', 'TypeScript', 'ethers v6', 'Express v5', 'Viem', 'React 19', 'Vite', 'Wagmi v3', 'Drizzle ORM', 'Hardhat 2.28'];
  stack.forEach((s, i) => {
    const sx = 56 + i * ((W - 112) / stack.length);
    doc.roundedRect(sx, stackY + 34, doc.widthOfString(s, { fontSize: 9 }) + 16, 26, 13)
      .fill(WHITE15).stroke(WHITE08);
    doc.fontSize(9).fillColor(WHITE).font('Helvetica-Bold').text(s, sx + 8, stackY + 43);
  });

  // Bottom tagline
  doc.fontSize(13).fillColor(WHITE).font('Helvetica-Bold')
    .text('"Live on X Layer Mainnet. Ready for agents on OKX AI."', 36, H - 56, { width: W - 72, align: 'center' });

  zeusShield(doc, W - 60, H - 56, 38);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('Zeus Insurance Protocol  ·  OKX Fund Pitch', 36, H - 28, { width: W - 120 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('5 / 6', W - 60, H - 28, { width: 40, align: 'right' });
}

// ── SLIDE 6 — Team & CTA ──────────────────────────────────────────────────────
function slide6(doc) {
  bg(doc);
  grid(doc);
  doc.rect(0, 0, 5, H).fill(GOLD);

  // Glow
  doc.save().circle(W * 0.72, H / 2, 200).fill(GOLD + '08').restore();

  badge(doc, 36, 30, 'TEAM & NEXT STEPS');
  doc.fontSize(28).fillColor(WHITE).font('Helvetica-Bold').text('Ready to Build the', 36, 62, { width: 560 });
  doc.fontSize(28).fillColor(GOLD).font('Helvetica-Bold').text('Future of Trust.', 36, 96, { width: 560 });
  goldBar(doc, 36, 133, 280, 2);

  // Team card
  const tY = 152;
  card(doc, 36, tY, 340, 170, { fill: WHITE15, stroke: WHITE08 });
  doc.fontSize(11).fillColor(WHITE60).font('Helvetica-Bold').text('FOUNDER', 56, tY + 18);
  doc.fontSize(17).fillColor(WHITE).font('Helvetica-Bold').text('Igor Ivanov', 56, tY + 36);
  doc.fontSize(10).fillColor(GOLD).font('Helvetica-Bold').text('Founder & Protocol Engineer', 56, tY + 58);
  goldBar(doc, 56, tY + 78, 60, 1);
  doc.fontSize(10).fillColor(WHITE60).font('Helvetica')
    .text('Deep expertise in Solidity, TypeScript,\nand DeFi protocol design.\nDeployed contracts on Ethereum, Base,\nand X Layer Mainnets.', 56, tY + 90, { width: 300, lineGap: 2 });

  // Expertise chips
  ['Solidity', 'Smart Contracts', 'DeFi', 'TypeScript', 'Web3'].forEach((s, i) => {
    const chipX = 56 + i * 58;
    const cW2 = doc.widthOfString(s, { fontSize: 8 }) + 14;
    doc.roundedRect(chipX, tY + 152, cW2, 18, 9).fill(GOLD + '1A').stroke(GOLD + '40');
    doc.fontSize(8).fillColor(GOLD).font('Helvetica-Bold').text(s, chipX + 7, tY + 157, { lineBreak: false });
  });

  // Traction card
  card(doc, 36, tY + 186, 340, 110, { fill: WHITE15, stroke: WHITE08 });
  doc.fontSize(11).fillColor(WHITE60).font('Helvetica-Bold').text('TRACTION', 56, tY + 204);
  const tractions = [
    ['✅', 'Deployed on X Layer Mainnet (Chain 196)'],
    ['✅', 'Listed on OKX AI Agent Marketplace (ASP #7202)'],
    ['✅', 'MCP Server with 7 AI agent tools'],
    ['✅', 'x402 Protocol integration live'],
  ];
  tractions.forEach(([icon, text], i) => {
    doc.fontSize(10).text(icon, 56, tY + 222 + i * 19);
    doc.fontSize(10).fillColor(WHITE60).font('Helvetica').text(text, 80, tY + 222 + i * 19, { width: 280 });
  });

  // Right: CTA
  const ctaX = 420;
  const ctaY = 152;
  const ctaW = W - ctaX - 36;

  zeusShield(doc, ctaX + ctaW / 2 - 70, ctaY, 140);
  doc.fontSize(22).fillColor(GOLD).font('Helvetica-Bold')
    .text('ZEUS', ctaX, ctaY + 148, { width: ctaW, align: 'center' });
  doc.fontSize(13).fillColor(WHITE60).font('Helvetica')
    .text('Insurance Protocol', ctaX, ctaY + 174, { width: ctaW, align: 'center' });

  goldBar(doc, ctaX + ctaW / 2 - 60, ctaY + 198, 120, 2);

  doc.fontSize(11).fillColor(WHITE).font('Helvetica')
    .text('Decentralized insurance and escrow\nfor the agentic economy.\n\nLive on X Layer Mainnet.', ctaX, ctaY + 212, { width: ctaW, align: 'center', lineGap: 3 });

  // CTA button
  const btnW = 220;
  const btnX = ctaX + ctaW / 2 - btnW / 2;
  const btnY = ctaY + 290;
  doc.roundedRect(btnX, btnY, btnW, 42, 21).fill(GOLD);
  doc.fontSize(13).fillColor('#080c14').font('Helvetica-Bold')
    .text('↗  Explore Zeus on OKX AI', btnX, btnY + 14, { width: btnW, align: 'center', lineBreak: false });

  // Contact
  doc.fontSize(9).fillColor(WHITE60).font('Helvetica')
    .text('t.me/IvanovVII  ·  zeusinsurance@mail.ru  ·  github.com/igor-vii/Zeus-Insurance-Escrow',
      ctaX, btnY + 62, { width: ctaW, align: 'center' });

  zeusShield(doc, W - 60, H - 56, 38);
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('Zeus Insurance Protocol  ·  OKX Fund Pitch', 36, H - 28, { width: W - 120 });
  doc.fontSize(8).fillColor(WHITE60).font('Helvetica').text('6 / 6', W - 60, H - 28, { width: 40, align: 'right' });
}

// ── Build the PDF ─────────────────────────────────────────────────────────────
const doc = new PDFDocument({
  size: [W, H],
  layout: 'landscape',
  margin: 0,
  info: {
    Title: 'Zeus Insurance Protocol — OKX Fund Pitch Deck',
    Author: 'Igor Ivanov',
    Subject: 'Decentralized Insurance for AI Agents',
    Keywords: 'Zeus, Insurance, X Layer, OKX, AI Agents, DeFi',
  },
});

const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

slide1(doc); doc.addPage();
slide2(doc); doc.addPage();
slide3(doc); doc.addPage();
slide4(doc); doc.addPage();
slide5(doc); doc.addPage();
slide6(doc);

doc.end();

stream.on('finish', () => {
  const size = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`✅ PDF saved: ${OUT} (${size} KB)`);
});
stream.on('error', (e) => { console.error('❌', e.message); process.exit(1); });
