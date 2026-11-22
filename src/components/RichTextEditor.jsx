import { useRef } from "react";

const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^) \n]+\))/g;
const BLOCK_PATTERN = /^(#{1,3}\s+|>\s*|[-*]\s+|\d+\.\s+)/;
const TOOLBAR_ACTIONS = [
  { label: "In đậm", title: "In đậm", before: "**", after: "**" },
  { label: "In nghiêng", title: "In nghiêng", before: "*", after: "*" },
  { label: "Tiêu đề", title: "Tiêu đề", before: "## ", block: true },
  { label: "Danh sách", title: "Danh sách đầu dòng", before: "- ", block: true },
  { label: "Danh sách số", title: "Danh sách đánh số", before: "1. ", block: true },
  { label: "Trích dẫn", title: "Trích dẫn", before: "> ", block: true },
  { label: "Đường dẫn", title: "Chèn đường dẫn", before: "[", after: "](https://)" },
];

function renderInline(text, keyPrefix = "inline") {
  const nodes = [];
  let cursor = 0;
  let match;
  let index = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = linkMatch?.[2] ?? "";
      let isSafeLink = false;
      try {
        isSafeLink = ["http:", "https:", "mailto:"].includes(
          new URL(href).protocol,
        );
      } catch {
        isSafeLink = false;
      }

      nodes.push(
        isSafeLink ? (
          <a
            href={href}
            key={key}
            rel="noreferrer"
            target={href.startsWith("mailto:") ? undefined : "_blank"}
          >
            {linkMatch[1]}
          </a>
        ) : (
          token
        ),
      );
    }
    cursor = match.index + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  INLINE_PATTERN.lastIndex = 0;
  return nodes;
}

export function RichTextContent({ content, className = "" }) {
  const lines = String(content ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const key = `block-${index}`;
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length + 1}`;
      blocks.push(<Tag key={key}>{renderInline(heading[2], key)}</Tag>);
      index += 1;
      continue;
    }

    if (/^>\s*/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^>\s*/.test(lines[index])) {
        quoteLines.push(lines[index++].replace(/^>\s*/, ""));
      }
      blocks.push(
        <blockquote key={key}>
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`${key}-${quoteIndex}`}>
              {renderInline(quoteLine, `${key}-${quoteIndex}`)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const isOrdered = /^\d/.test(listMatch[2]);
      const items = [];
      while (index < lines.length) {
        const itemMatch = lines[index].match(/^(\s*)([-*]|\d+\.)\s+(.+)$/);
        if (!itemMatch || /^\d/.test(itemMatch[2]) !== isOrdered) break;
        items.push(itemMatch[3]);
        index += 1;
      }
      const List = isOrdered ? "ol" : "ul";
      blocks.push(
        <List key={key}>
          {items.map((item, itemIndex) => (
            <li key={`${key}-${itemIndex}`}>
              {renderInline(item, `${key}-${itemIndex}`)}
            </li>
          ))}
        </List>,
      );
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !BLOCK_PATTERN.test(lines[index])
    ) {
      paragraph.push(lines[index]);
      index += 1;
    }
    if (paragraph.length === 0) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={key}>
        {paragraph.map((paragraphLine, lineIndex) => (
          <span key={`${key}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {renderInline(paragraphLine, `${key}-${lineIndex}`)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className={`rich-text-content ${className}`.trim()}>{blocks}</div>;
}

export default function RichTextEditor({
  id,
  label,
  value,
  onChange,
  minLength,
  maxLength,
  required = false,
  rows = 8,
  placeholder,
}) {
  const textareaRef = useRef(null);

  function applyAction(action) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const source = value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    let replaceStart = selectionStart;
    let replaceEnd = selectionEnd;
    let selectedText = source.slice(selectionStart, selectionEnd);

    if (action.block) {
      replaceStart = source.lastIndexOf("\n", selectionStart - 1) + 1;
      const nextLineBreak = source.indexOf("\n", selectionEnd);
      replaceEnd = nextLineBreak === -1 ? source.length : nextLineBreak;
      selectedText = source.slice(replaceStart, replaceEnd);
      selectedText = selectedText
        .split("\n")
        .map((line) => (line.trim() ? `${action.before}${line}` : line))
        .join("\n");
    } else {
      selectedText ||= "văn bản";
      selectedText = `${action.before}${selectedText}${action.after}`;
    }

    const nextValue =
      source.slice(0, replaceStart) + selectedText + source.slice(replaceEnd);
    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const caret = replaceStart + selectedText.length;
      textarea.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="rich-text-editor">
      <label htmlFor={id}>{label}</label>
      <div className="rich-text-toolbar" role="group" aria-label="Định dạng nội dung">
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            aria-label={action.label}
            key={action.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => applyAction(action)}
            title={action.title}
            type="button"
          >
            {action.label}
          </button>
        ))}
      </div>
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        minLength={minLength}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        required={required}
      />
      {maxLength && (
        <span className="admin-character-count">
          {value.length.toLocaleString("vi-VN")}/{maxLength.toLocaleString("vi-VN")} ký tự
        </span>
      )}
      <div className="rich-text-editor-help">
        Hỗ trợ in đậm, in nghiêng, tiêu đề, danh sách, trích dẫn và đường dẫn.
      </div>
    </div>
  );
}
