#!/usr/bin/env node
/**
 * 博客文章导入导出工具
 * 用法:
 *   node posts-tool.js export          导出所有文章 → posts-export.json
 *   node posts-tool.js import          从 posts-import.json 导入文章
 */

const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, 'src', 'content', 'posts');
const EXPORT_FILE = path.join(__dirname, 'posts-export.json');
const IMPORT_FILE = path.join(__dirname, 'posts-import.json');

// ========== 导出 ==========
function exportPosts() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error('❌ 文章目录不存在:', POSTS_DIR);
    process.exit(1);
  }

  function walkDir(dir) {
    let results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['image', 'cover', 'images'].includes(entry.name)) {
          results = results.concat(walkDir(full));
        }
      } else if (/\.(md|mdx)$/.test(entry.name)) {
        results.push(full);
      }
    }
    return results;
  }

  function parseFrontmatter(content) {
    const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) return { data: {}, body: content };
    const data = {};
    m[1].split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (val.startsWith('[') && val.endsWith(']'))
        val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
      else if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);
      else val = val.replace(/^['"]|['"]$/g, '');
      if (key) data[key] = val;
    });
    return { data, body: m[2].trim() };
  }

  const files = walkDir(POSTS_DIR);
  const posts = files.map(file => {
    const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf-8'));
    const rel = path.relative(POSTS_DIR, file).replace(/\\/g, '/');
    return {
      slug: rel.replace(/\.mdx?$/, ''),
      filePath: file.replace(/\\/g, '/'),
      title: data.title || '',
      published: data.published || data.date || '',
      updated: data.updated || '',
      draft: !!data.draft,
      description: data.description || '',
      image: data.image || '',
      tags: Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []),
      category: data.category || '',
      lang: data.lang || '',
      pinned: !!data.pinned,
      author: data.author || '',
      sourceLink: data.sourceLink || '',
      licenseName: data.licenseName || '',
      licenseUrl: data.licenseUrl || '',
      comment: data.comment !== false,
      password: data.password || '',
      passwordHint: data.passwordHint || '',
      body
    };
  }).sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0));

  fs.writeFileSync(EXPORT_FILE, JSON.stringify(posts, null, 2), 'utf-8');
  console.log(`✅ 导出完成: ${posts.length} 篇文章 → ${EXPORT_FILE}`);
}

// ========== 导入 ==========
function importPosts() {
  if (!fs.existsSync(IMPORT_FILE)) {
    console.error('❌ 导入文件不存在:', IMPORT_FILE);
    console.error('   请先创建 posts-import.json 文件');
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(IMPORT_FILE, 'utf-8'));
  if (!Array.isArray(posts) || !posts.length) {
    console.error('❌ posts-import.json 为空或格式不正确');
    process.exit(1);
  }

  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  const yamlVal = v => {
    if (typeof v !== 'string') return String(v);
    return /[:#"[\]{}]/.test(v) || v === ''
      ? '"' + v.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
      : v;
  };

  const buildFM = p => {
    const L = ['---'];
    if (p.title)       L.push('title: ' + yamlVal(p.title));
    if (p.published)   L.push('published: ' + p.published);
    if (p.updated)     L.push('updated: ' + p.updated);
    if (p.draft)       L.push('draft: true');
    if (p.description) L.push('description: ' + yamlVal(p.description));
    if (p.image)       L.push('image: ' + yamlVal(p.image));
    if (Array.isArray(p.tags) && p.tags.length)
      L.push('tags: [' + p.tags.map(yamlVal).join(', ') + ']');
    if (p.category)    L.push('category: ' + yamlVal(p.category));
    if (p.lang)        L.push('lang: ' + yamlVal(p.lang));
    if (p.pinned)      L.push('pinned: true');
    if (p.author)      L.push('author: ' + yamlVal(p.author));
    if (p.sourceLink)  L.push('sourceLink: ' + yamlVal(p.sourceLink));
    if (p.licenseName) L.push('licenseName: ' + yamlVal(p.licenseName));
    if (p.licenseUrl)  L.push('licenseUrl: ' + yamlVal(p.licenseUrl));
    if (p.comment === false) L.push('comment: false');
    if (p.password)    L.push('password: ' + yamlVal(p.password));
    if (p.passwordHint)L.push('passwordHint: ' + yamlVal(p.passwordHint));
    L.push('---');
    return L.join('\n');
  };

  const slugify = s => s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || 'untitled-' + Date.now();

  let created = 0, updated = 0, skipped = 0;

  for (const p of posts) {
    if (!p.title && !p.slug) { skipped++; continue; }

    const filePath = (p.filePath && p.filePath.endsWith('.md'))
      ? p.filePath
      : path.join(POSTS_DIR, p.category ? slugify(p.category) : '', (p.slug || slugify(p.title)) + '.md');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const exists = fs.existsSync(filePath);
    fs.writeFileSync(filePath, buildFM(p) + '\n\n' + (p.body || '') + '\n', 'utf-8');
    exists ? (updated++, console.log('  📝 更新:', filePath)) : (created++, console.log('  ✨ 新建:', filePath));
  }

  console.log(`\n✅ 导入完成: ${created} 新建, ${updated} 更新, ${skipped} 跳过`);
}

// ========== 主入口 ==========
const cmd = process.argv[2];
if (cmd === 'export') exportPosts();
else if (cmd === 'import') importPosts();
else {
  console.log(`
博客文章导入导出工具

用法:
  node posts-tool.js export    导出所有文章为 posts-export.json
  node posts-tool.js import    从 posts-import.json 导入文章
`);
}
