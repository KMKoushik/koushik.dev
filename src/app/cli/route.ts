import { NextResponse } from "next/server";
import sharp from "sharp";

// Catppuccin Mocha palette (ANSI approximations)
const COLORS = {
  text: "\u001b[38;2;205;214;244m", // text
  subtext0: "\u001b[38;2;186;194;222m",
  subtext1: "\u001b[38;2;166;173;200m",
  base: "\u001b[48;2;30;30;46m", // background
  mauve: "\u001b[38;2;203;166;247m",
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  underline: "\u001b[4m",
};

function padAround(content: string): string {
  // Add minimal padding to simulate page margin in terminal
  const pad = "  ";
  return content
    .split("\n")
    .map((line) => pad + line)
    .join("\n");
}

async function renderAvatarAnsi(width: number): Promise<string> {
  try {
    // Use the exact URL as provided by the user
    const avatarUrl =
      "https://avatars.githubusercontent.com/u/24666922?s=400&u=2f9bdbf04ee806afa8a7153a1924696024e4c87c&v=4";
    const resp = await fetch(avatarUrl, { cache: "force-cache" });
    if (!resp.ok) return "";
    const buffer = Buffer.from(await resp.arrayBuffer());

    // Decode and resize with Sharp (high fidelity, supports PNG/JPEG/WebP)
    const base = { r: 30, g: 30, b: 46 };
    const srcMeta = await sharp(buffer).metadata();
    const srcWidth = srcMeta.width || 0;
    const srcHeight = srcMeta.height || 0;
    if (!srcWidth || !srcHeight) return "";

    const targetWidth = Math.max(8, Math.min(width, srcWidth));
    const targetPixelHeight = Math.max(
      8,
      Math.round((srcHeight / srcWidth) * targetWidth)
    );

    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .resize({ width: targetWidth, height: targetPixelHeight, fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const w = info.width;
    const h = info.height;
    const lines: string[] = [];
    for (let y = 0; y < h; y += 2) {
      let row = "";
      for (let x = 0; x < w; x++) {
        const idxTop = (y * w + x) * 4;
        const rt = data[idxTop + 0] || 0;
        const gt = data[idxTop + 1] || 0;
        const bt = data[idxTop + 2] || 0;
        const at = data[idxTop + 3] || 255;

        const yb = Math.min(h - 1, y + 1);
        const idxBottom = (yb * w + x) * 4;
        const rb = data[idxBottom + 0] || 0;
        const gb = data[idxBottom + 1] || 0;
        const bb = data[idxBottom + 2] || 0;
        const ab = data[idxBottom + 3] || 255;

        const art = at / 255;
        const arb = ab / 255;
        const rTop = Math.round(rt * art + base.r * (1 - art));
        const gTop = Math.round(gt * art + base.g * (1 - art));
        const bTop = Math.round(bt * art + base.b * (1 - art));
        const rBottom = Math.round(rb * arb + base.r * (1 - arb));
        const gBottom = Math.round(gb * arb + base.g * (1 - arb));
        const bBottom = Math.round(bb * arb + base.b * (1 - arb));

        row += `\u001b[38;2;${rTop};${gTop};${bTop}m\u001b[48;2;${rBottom};${gBottom};${bBottom}m▀`;
      }
      row += COLORS.reset;
      lines.push(row);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

async function renderCli(): Promise<string> {
  const lines: string[] = [];

  // Background block (not all terminals respect persistent bg, but set once)
  lines.push(COLORS.base);

  // Avatar block (pixelated)
  const avatar = await renderAvatarAnsi(24);
  if (avatar) {
    lines.push(avatar);
    lines.push("");
  }

  // Header
  lines.push(`${COLORS.mauve}${COLORS.bold}koushik mohan${COLORS.reset}`);
  lines.push(
    `${COLORS.text}i build apps on weekdays and open source apps on weekends${COLORS.reset}`
  );
  lines.push("");

  // open source
  lines.push(`${COLORS.subtext0}${COLORS.bold}open source${COLORS.reset}`);
  lines.push(
    `${COLORS.text}- ${COLORS.mauve}unsend${COLORS.reset}${COLORS.text}, an open source email platform${COLORS.reset}`
  );
  lines.push(
    `${COLORS.text}- ${COLORS.mauve}splitpro${COLORS.reset}${COLORS.text}, an open source splitwise alternative${COLORS.reset}`
  );
  lines.push("");

  // work
  lines.push(`${COLORS.subtext0}${COLORS.bold}work${COLORS.reset}`);
  lines.push(
    `${COLORS.text}- ${COLORS.mauve}raindrop${COLORS.reset}${COLORS.text}, founding engineer${COLORS.reset}`
  );
  lines.push(
    `${COLORS.text}- ${COLORS.mauve}opyn${COLORS.reset}${COLORS.text}, frontend tech lead${COLORS.reset}`
  );
  lines.push(
    `${COLORS.text}- ${COLORS.mauve}zoho${COLORS.reset}${COLORS.text}, software engineer${COLORS.reset}`
  );
  lines.push("");

  // contact
  lines.push(`${COLORS.subtext0}${COLORS.bold}contact${COLORS.reset}`);
  lines.push(
    `${COLORS.subtext1}email${COLORS.reset}${COLORS.text}: ${COLORS.mauve}hey@koushik.dev${COLORS.reset}`
  );
  lines.push(
    `${COLORS.subtext1}x${COLORS.reset}${COLORS.text}: ${COLORS.mauve}https://x.com/KM_Koushik_${COLORS.reset}`
  );
  lines.push(
    `${COLORS.subtext1}github${COLORS.reset}${COLORS.text}: ${COLORS.mauve}https://github.com/KMKoushik${COLORS.reset}`
  );
  lines.push(
    `${COLORS.subtext1}linkedin${COLORS.reset}${COLORS.text}: ${COLORS.mauve}https://www.linkedin.com/in/koushik-mohan/${COLORS.reset}`
  );

  const body = padAround(lines.join("\n")) + "\n" + COLORS.reset;
  return body;
}

export async function GET() {
  const body = await renderCli();
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=600",
    },
  });
}

export const runtime = "nodejs";
