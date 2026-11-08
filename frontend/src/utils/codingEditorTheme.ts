import type { BeforeMount } from '@monaco-editor/react';

export const codingEditorTheme = 'codelearning-dark';
export const codingEditorFontFamily = '"JetBrainsMono Nerd Font Mono", Menlo, Consolas, monospace';

export const configureCodingEditor: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(codingEditorTheme, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5C6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C678DD' },
      { token: 'string', foreground: '98C379' },
      { token: 'number', foreground: 'D19A66' },
      { token: 'type', foreground: 'E5C07B' },
      { token: 'type.identifier', foreground: 'E5C07B' },
      { token: 'identifier', foreground: 'ABB2BF' },
      { token: 'function', foreground: '61AFEF' },
      { token: 'delimiter', foreground: 'ABB2BF' },
      { token: 'operator', foreground: '56B6C2' },
    ],
    colors: {
      'editor.background': '#101115',
      'editor.foreground': '#F7F7FA',
      'editorLineNumber.foreground': '#888895',
      'editorLineNumber.activeForeground': '#E9E5F3',
      'editor.lineHighlightBackground': '#1B1C21',
      'editor.selectionBackground': '#504767',
      'editorCursor.foreground': '#FFAD66',
      'editorIndentGuide.background1': '#303038',
      'editorWidget.background': '#1B1C21',
      'editorWidget.border': '#414149',
    },
  });

  if (typeof document !== 'undefined' && document.fonts) {
    void document.fonts.load('14px "JetBrainsMono Nerd Font Mono"').then(
      () => monaco.editor.remeasureFonts(),
      () => monaco.editor.remeasureFonts(),
    );
  }
};
