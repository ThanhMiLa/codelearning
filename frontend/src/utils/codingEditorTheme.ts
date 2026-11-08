import type { BeforeMount } from '@monaco-editor/react';

export const codingEditorTheme = 'codelearning-dark';
export const codingEditorFontFamily = '"JetBrainsMono Nerd Font Mono", Menlo, Consolas, monospace';

export const configureCodingEditor: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(codingEditorTheme, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9D9DAF' },
      { token: 'keyword', foreground: 'D0BBFF' },
      { token: 'string', foreground: 'C5DEA9' },
      { token: 'number', foreground: 'E8CD96' },
      { token: 'type', foreground: 'E9E5F3' },
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
