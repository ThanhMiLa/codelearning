import { useState } from 'react';
import { Braces, Check, FileCode2, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const examples = {
  python: {
    label: 'Python',
    filename: 'two_sum.py',
    lines: [
      <><span className="code-comment"># A small problem. A good place to start.</span></>,
      <><span className="code-keyword">def</span> <span className="code-function">two_sum</span>(nums, target):</>,
      <>    seen = {'{}'}</>,
      <></>,
      <>    <span className="code-keyword">for</span> i, num <span className="code-keyword">in</span> <span className="code-function">enumerate</span>(nums):</>,
      <>        complement = target - num</>,
      <>        <span className="code-keyword">if</span> complement <span className="code-keyword">in</span> seen:</>,
      <>            <span className="code-keyword">return</span> [seen[complement], i]</>,
      <>        seen[num] = i</>,
      <></>,
      <>    <span className="code-keyword">return</span> []</>,
      <></>,
      <><span className="code-function">print</span>(<span className="code-function">two_sum</span>([<span className="code-number">2, 7, 11, 15</span>], <span className="code-number">9</span>))</>,
    ],
  },
  java: {
    label: 'Java',
    filename: 'Solution.java',
    lines: [
      <><span className="code-keyword">import</span> java.util.HashMap;</>,
      <></>,
      <><span className="code-keyword">class</span> <span className="code-function">Solution</span> {'{'}</>,
      <>  <span className="code-keyword">public int</span>[] <span className="code-function">twoSum</span>(<span className="code-keyword">int</span>[] nums, <span className="code-keyword">int</span> target) {'{'}</>,
      <>    <span className="code-keyword">var</span> seen = <span className="code-keyword">new</span> <span className="code-function">HashMap</span>&lt;Integer, Integer&gt;();</>,
      <>    <span className="code-keyword">for</span> (<span className="code-keyword">int</span> i = <span className="code-number">0</span>; i &lt; nums.length; i++) {'{'}</>,
      <>      <span className="code-keyword">int</span> complement = target - nums[i];</>,
      <>      <span className="code-keyword">if</span> (seen.<span className="code-function">containsKey</span>(complement)) {'{'}</>,
      <>        <span className="code-keyword">return new int</span>[] {'{seen.get(complement), i}'};</>,
      <>      {'}'}</>,
      <>      seen.<span className="code-function">put</span>(nums[i], i);</>,
      <>    {'}'}</>,
      <>    <span className="code-keyword">return new int</span>[<span className="code-number">0</span>];</>,
      <>  {'}'}</>,
      <>{'}'}</>,
    ],
  },
  javascript: {
    label: 'JavaScript',
    filename: 'two_sum.js',
    lines: [
      <><span className="code-comment">// A small problem. A good place to start.</span></>,
      <><span className="code-keyword">function</span> <span className="code-function">twoSum</span>(nums, target) {'{'}</>,
      <>  <span className="code-keyword">const</span> seen = <span className="code-keyword">new</span> <span className="code-function">Map</span>();</>,
      <>  <span className="code-keyword">for</span> (<span className="code-keyword">let</span> i = <span className="code-number">0</span>; i &lt; nums.length; i++) {'{'}</>,
      <>    <span className="code-keyword">const</span> complement = target - nums[i];</>,
      <>    <span className="code-keyword">if</span> (seen.<span className="code-function">has</span>(complement)) {'{'}</>,
      <>      <span className="code-keyword">return</span> [seen.<span className="code-function">get</span>(complement), i];</>,
      <>    {'}'}</>,
      <>    seen.<span className="code-function">set</span>(nums[i], i);</>,
      <>  {'}'}</>,
      <>  <span className="code-keyword">return</span> [];</>,
      <>{'}'}</>,
      <>console.<span className="code-function">log</span>(<span className="code-function">twoSum</span>([<span className="code-number">2, 7, 11, 15</span>], <span className="code-number">9</span>));</>,
    ],
  },
  cpp: {
    label: 'C++',
    filename: 'two_sum.cpp',
    lines: [
      <><span className="code-comment">// A small problem. A good place to start.</span></>,
      <><span className="code-keyword">#include</span> <span className="code-string">&lt;vector&gt;</span></>,
      <><span className="code-keyword">#include</span> <span className="code-string">&lt;unordered_map&gt;</span></>,
      <><span className="code-keyword">using namespace</span> std;</>,
      <></>,
      <><span className="code-keyword">vector&lt;int&gt;</span> <span className="code-function">twoSum</span>(<span className="code-keyword">const</span> vector&lt;int&gt;&amp; nums, <span className="code-keyword">int</span> target) {'{'}</>,
      <>  unordered_map&lt;<span className="code-keyword">int</span>, <span className="code-keyword">int</span>&gt; seen;</>,
      <>  <span className="code-keyword">for</span> (<span className="code-keyword">int</span> i = <span className="code-number">0</span>; i &lt; (<span className="code-keyword">int</span>)nums.size(); ++i) {'{'}</>,
      <>    <span className="code-keyword">int</span> complement = target - nums[i];</>,
      <>    <span className="code-keyword">if</span> (seen.count(complement)) <span className="code-keyword">return</span> {'{seen[complement], i}'};</>,
      <>    seen[nums[i]] = i;</>,
      <>  {'}'}</>,
      <>  <span className="code-keyword">return</span> {'{}'};</>,
      <>{'}'}</>,
    ],
  },
} as const;

type ExampleLanguage = keyof typeof examples;

const HomeCodePreview = () => {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<ExampleLanguage>('python');
  const example = examples[language];

  return (
    <div className="home-editor">
      <div className="home-editor-toolbar">
        <div className="home-editor-file"><FileCode2 size={14} aria-hidden="true" /><span>{example.filename}</span></div>
        <div className="home-editor-languages" role="group" aria-label={t('home.preview.select_language')}>
          {(Object.keys(examples) as ExampleLanguage[]).map((key) => (
            <button key={key} type="button" onClick={() => setLanguage(key)} aria-pressed={language === key}>
              {examples[key].label}
            </button>
          ))}
        </div>
      </div>
      <div className="home-editor-body">
        <div className="home-editor-source" tabIndex={0} role="region" aria-label={t('home.preview.source', { language: example.label })}>
          <pre><code>{example.lines.map((line, index) => (
            <span className="home-code-line" key={index}>
              <span className="home-line-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span>{line}{'\n'}</span>
            </span>
          ))}</code></pre>
        </div>
        <aside className="home-editor-problem" aria-label={t('home.preview.problem')}>
          <div className="home-problem-label"><Braces size={14} aria-hidden="true" /> {t('home.preview.problem')}</div>
          <div className="home-problem-title"><h2>Two Sum</h2><span>{t('home.preview.easy')}</span></div>
          <p>{t('home.preview.problem_description')}</p>
          <dl className="home-testcase">
            <div><dt>{t('home.preview.input')}</dt><dd><span>nums</span> = [2, 7, 11, 15]<br /><span>target</span> = 9</dd></div>
            <div><dt>{t('home.preview.output')}</dt><dd>[0, 1]</dd></div>
          </dl>
          <div className="home-example-explanation"><Check size={14} aria-hidden="true" /><span>nums[0] + nums[1] = 9</span></div>
        </aside>
      </div>
      <div className="home-editor-statusbar">
        <span><GitBranch size={12} aria-hidden="true" /> main <Check size={12} aria-hidden="true" /></span>
        <span>{t('home.preview.example_solution')}</span>
        <span>{example.label}<span className="home-editor-encoding">UTF-8</span></span>
      </div>
    </div>
  );
};

export default HomeCodePreview;
