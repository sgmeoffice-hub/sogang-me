import type { PageContent } from './types';

export const undergraduate: Record<string, PageContent> = {
  'undergraduate/majors': { ko: '', en: '' },
  'undergraduate/admission': {
    ko: `<p>학부 입학 정보에 대한 상세한 내용은 서강대학교 입학처 홈페이지에서 확인하실 수 있습니다.</p>
<p><a href="https://admission.sogang.ac.kr" target="_blank" rel="noreferrer" class="btn-primary !no-underline !text-white">서강대학교 입학처 바로가기 →</a></p>
<h2>기계공학과 소개 자료</h2>
<p>자유전공학부 학생과 기계공학에 관심 있는 예비 공학도를 위한 소개 자료는 <a href="/ko/board/notice">공지사항</a>에서 내려받을 수 있습니다.</p>`,
    en: `<p>Detailed undergraduate admission information is available on the Sogang University Office of Admissions website.</p>
<p><a href="https://admission.sogang.ac.kr" target="_blank" rel="noreferrer" class="btn-primary !no-underline !text-white">Office of Admissions →</a></p>
<h2>International applicants</h2>
<p>International students apply through the Office of Admissions (international track). For questions about the mechanical engineering program, contact the department office at <a href="mailto:mechadmin@sogang.ac.kr">mechadmin@sogang.ac.kr</a> or +82-2-705-8631.</p>`,
  },
  'undergraduate/curriculum': {
    ko: `<p class="text-sg-steel">2026년 입학생 기준 교과과정입니다. 각 학번별 교과과정은 세인트(SAINT)의 졸업메뉴 또는 서강대학교 요람에서 확인 가능합니다.</p>
<h2>1. 학점 이수요건</h2>
<table>
<thead><tr><th rowspan="2">구분</th><th colspan="3">공통</th><th rowspan="2">전공입문</th><th colspan="3">전공</th><th rowspan="2">총 이수학점</th></tr>
<tr><th>필수</th><th>선택 ①②③④</th><th>소계</th><th>필수</th><th>선택</th><th>소계</th></tr></thead>
<tbody>
<tr><td>심화전공</td><td>11</td><td>3 / 3 / 3 / 3*</td><td>23</td><td>23</td><td>30</td><td>42**</td><td>72</td><td>130</td></tr>
<tr><td>다전공 (제1전공: 기계공학)</td><td>11</td><td>3 / 3 / 3 / 3*</td><td>23</td><td>22</td><td>27</td><td>24</td><td>51</td><td>130</td></tr>
<tr><td>다전공 (제1전공: 타전공)</td><td colspan="3">입학전공별 이수기준에 따름</td><td>22***</td><td>21</td><td>24</td><td>45</td><td>제1전공에 따름</td></tr>
</tbody></table>
<ul class="text-[13.5px] text-sg-steel">
<li>* 자연계열(SCIENCE기반 자유전공학부 학생 제외)은 ④ '인간과 과학 &amp; AI 영역'의 미적분학Ⅰ을 필수선택으로 이수해야 함</li>
<li>** 공과대학 및 소프트웨어융합대학 내 타 전공과목 이수 시 최대 6학점까지 기계공학 전공선택으로 인정됨 (제1전공이 기계공학 심화전공에 한함)</li>
<li>*** 다전공자 중 제1전공이 타전공인 학생은 미적분학I, 미적분학II를 전공입문 교과로 반드시 이수해야 함</li>
<li>※ 자유전공학부생이 제1전공을 기계공학 선택 시, 다전공(제1전공: 기계공학) 이수요건을 원칙으로 따르지만 원하는 경우 심화과정을 선택할 수 있음</li>
</ul>
<h2>2. 교과목 이수요건</h2>
<h3>전공입문 (필수 이수, 전공 학점에는 미포함)</h3>
<table><thead><tr><th>구분</th><th>과목명</th><th>학점</th><th>비고</th></tr></thead><tbody>
<tr><td rowspan="3">심화전공</td><td>PHY1001 일반물리Ⅰ, PHY1002 일반물리Ⅱ, PHY1101 일반물리실험Ⅰ, PHY1102 일반물리실험Ⅱ, STS2006 미적분학Ⅱ</td><td>11</td><td rowspan="3">합계 23</td></tr>
<tr><td>CHM1001 일반화학Ⅰ</td><td>3</td></tr>
<tr><td>MEE1006 지능형 기계설계생산 입문, MEE2006 공학수학Ⅰ, MEE2007 공학수학Ⅱ</td><td>9</td></tr>
<tr><td rowspan="2">다전공 (기계공학)</td><td>PHY1001, PHY1002, PHY1101, STS2006, &lt;BIO1001 일반생물학Ⅰ, CHM1001 일반화학Ⅰ&gt; 중 택1</td><td>13</td><td rowspan="2">합계 22</td></tr>
<tr><td>MEE1006, MEE2006, MEE2007</td><td>9</td></tr>
<tr><td rowspan="3">다전공 (제1전공: 타전공)</td><td>STS2005 미적분학Ⅰ, STS2006 미적분학Ⅱ</td><td>6</td><td>2006학번부터 추가 이수</td></tr>
<tr><td>PHY1001, PHY1002, PHY1101, &lt;BIO1001, CHM1001&gt; 중 택1</td><td>10</td><td rowspan="2">합계 22 · MAT2410/2420 응용수학Ⅰ,Ⅱ 대체 인정 (공과대학 내 고급공학수학Ⅰ,Ⅱ, 화공수학Ⅰ,Ⅱ 상호 인정)</td></tr>
<tr><td>MEE2006 공학수학Ⅰ, MEE2007 공학수학Ⅱ</td><td>6</td></tr>
</tbody></table>
<p class="text-[13.5px] text-sg-steel">※ SCIENCE기반 자유전공학부 전공필수 대체 인정: SCI1011 과학수학 → STS2006 미적분학Ⅱ / SCI1012 통합물리 → PHY1001 일반물리Ⅰ / SCI1013 통합화학 → CHM1001 일반화학Ⅰ / SCI1014 통합생물학 → BIO1001 일반생물학Ⅰ</p>
<h3>전공필수 과목</h3>
<table><thead><tr><th>구분</th><th>과목코드/과목명</th><th>학점</th><th>비고</th></tr></thead><tbody>
<tr><td rowspan="2">기계공학 심화과정</td><td>MEE2011 고체역학, MEE2012 유체역학Ⅰ, MEE2013 동역학, MEE2022 열역학Ⅰ, MEE2025 기계제작실습, MEE3004 생산공정, MEE3015 설계방법론(캡스톤디자인), MEE3025 기계공학실험Ⅰ, MEE4021 창의적종합설계(캡스톤디자인)</td><td>27</td><td rowspan="2">MEE2014 기계재료기초, MEE3013 자동제어, MEE3032 열전달 중 1개 이상 이수 시 전공필수 졸업학점으로 최대 3학점까지 인정하며, 초과 학점은 전공선택으로 인정</td></tr>
<tr><td>MEE2014 기계재료기초 / MEE3013 자동제어 / MEE3032 열전달 중 택1</td><td>3</td></tr>
<tr><td>다전공 (제1전공: 기계공학)</td><td>위 9개 전공필수 과목</td><td>27</td><td></td></tr>
<tr><td>다전공 (제1전공: 타전공)</td><td>MEE2011 고체역학, MEE2012 유체역학Ⅰ, MEE2013 동역학, MEE2022 열역학Ⅰ, MEE2025 기계제작실습, MEE3004 생산공정, MEE3025 기계공학실험Ⅰ</td><td>21</td><td></td></tr>
</tbody></table>
<h3>기타 이수 요건</h3>
<ul>
<li>MEE4046(특수연구)는 전공학점에 포함되지 않으나 졸업학점에는 포함됨</li>
<li>모든 신입생은 1학년 1학기에 개설되는 COR1028 알바트로스세미나(기계공학 전용분반) 과목을 필수적으로 이수해야 함</li>
<li>MEE3301 연구프로젝트I, MEE3302 연구프로젝트II 과목은 최대 3학점까지 전공학점으로 포함됨 (두 과목 모두 수강 시 초수강 과목은 전공 3학점, 후수강 과목은 기타 3학점으로 인정. 단, 2022년 2학기까지 6학점을 취득한 경우 최대 6학점까지 전공학점으로 인정)</li>
<li>심화전공에서 다전공으로 변경 시, 전공입문 MEE1006 지능형 기계설계생산 입문 과목은 자유선택으로 인정됨</li>
</ul>
<h2>3. 전공교육과정 이수 로드맵 (심화과정)</h2>
<table><thead><tr><th>분야</th><th>1학년</th><th>2학년</th><th>3학년</th><th>4학년</th></tr></thead><tbody>
<tr><th>공통교과</th><td colspan="4">성철과 성정I, 자연계 글쓰기, 알바트로스 세미나, 미적분학1, 기초인공지능프로그래밍, &lt;글로벌 언어 영역&gt; 택1, &lt;①인간과 신앙&gt; &lt;②인간과 사상&gt; &lt;③인간과 사회&gt; 영역 각 택1</td></tr>
<tr><th>전공입문</th><td>미적분학Ⅱ, 일반물리Ⅰ·Ⅱ, 일반물리실험Ⅰ·Ⅱ, 일반화학Ⅰ, 지능형 기계설계생산 입문</td><td>공학수학I, 공학수학II</td><td></td><td></td></tr>
<tr><th>기계공학 일반</th><td></td><td></td><td>기계공학실험I, 기계학습 기초수학, 기계공학해석, 연구프로젝트Ⅰ</td><td>창의적종합설계, 자동차공학, 기계공학세미나, 연구프로젝트Ⅱ</td></tr>
<tr><th>설계 및 재료역학</th><td></td><td>고체역학, 제품설계기초</td><td>재료거동학, 부품설계, 유한요소해석, 설계방법론(캡스톤디자인)</td><td>최적설계 및 실습, 바이오역학, 연속체역학, 실험계획법과 통계분석, 음향학의 기초, 유한요소해석과 응용, 재료모델링과 피로파괴</td></tr>
<tr><th>열·유체 및 에너지</th><td></td><td>열역학I, 유체역학I</td><td>열역학II, 자동차동력공학, 유체역학II, 열전달, 냉동 및 공기조화, 신재생에너지공학개론</td><td>미소열유체역학, 열유체시스템설계, 전산유체역학, 연료전지개론, 연소 및 물질전달, 전산열전달, 통계열역학 및 미소열전달, 고급열전달</td></tr>
<tr><th>제어·진동·로보틱스</th><td></td><td>동역학</td><td>진동학, 자동제어, 디지털제어시스템, 바이오모방공학개론, 메카트로닉스</td><td>고급동역학, 로봇설계 및 제어, 고급제어1, 시스템모델링 및 해석, 고급메카트로닉스</td></tr>
<tr><th>생산공학</th><td></td><td>기계제작실습, 기계재료기초</td><td>생산공정, CAD, 마이크로나노기계공학, 복합재료입문</td><td>MEMS 설계제작, 공정설계의 CAE, 반도체공학, 메카노바이오공학, 나노공학개론</td></tr>
<tr><th>현장실습</th><td></td><td></td><td colspan="2">기계공학현장실습</td></tr>
</tbody></table>`,
    en: `<p class="text-sg-steel">Curriculum for students entering in 2026. Curricula for earlier cohorts are available on SAINT (graduation menu) or in the University Bulletin.</p>
<h2>1. Credit requirements</h2>
<table>
<thead><tr><th rowspan="2">Track</th><th colspan="3">General education</th><th rowspan="2">Major prerequisites</th><th colspan="3">Major</th><th rowspan="2">Total</th></tr>
<tr><th>Required</th><th>Elective ①②③④</th><th>Subtotal</th><th>Required</th><th>Elective</th><th>Subtotal</th></tr></thead>
<tbody>
<tr><td>Intensive major</td><td>11</td><td>3 / 3 / 3 / 3*</td><td>23</td><td>23</td><td>30</td><td>42**</td><td>72</td><td>130</td></tr>
<tr><td>Multiple major (primary: ME)</td><td>11</td><td>3 / 3 / 3 / 3*</td><td>23</td><td>22</td><td>27</td><td>24</td><td>51</td><td>130</td></tr>
<tr><td>Multiple major (primary: other)</td><td colspan="3">Per entering major</td><td>22***</td><td>21</td><td>24</td><td>45</td><td>Per primary major</td></tr>
</tbody></table>
<ul class="text-[13.5px] text-sg-steel">
<li>* Science-track students (except SCIENCE-based Liberal Major) must take Calculus I in area ④ "Humans, Science &amp; AI" as a required elective.</li>
<li>** Up to 6 credits from other majors in the College of Engineering or College of Software Convergence count as ME electives (intensive major only).</li>
<li>*** Multiple-major students whose primary major is not ME must take Calculus I and II as prerequisites.</li>
<li>※ Liberal Major students who choose ME as their primary major follow the multiple-major (primary: ME) requirements in principle, but may opt for the intensive track if they wish.</li>
</ul>
<h2>2. Course requirements</h2>
<h3>Major prerequisites (required; not counted toward major credits)</h3>
<table><thead><tr><th>Track</th><th>Courses</th><th>Credits</th><th>Note</th></tr></thead><tbody>
<tr><td rowspan="3">Intensive</td><td>PHY1001 General Physics I, PHY1002 General Physics II, PHY1101 Physics Lab I, PHY1102 Physics Lab II, STS2006 Calculus II</td><td>11</td><td rowspan="3">Total 23</td></tr>
<tr><td>CHM1001 General Chemistry I</td><td>3</td></tr>
<tr><td>MEE1006 Intro to Intelligent Mechanical Design &amp; Manufacturing, MEE2006 Engineering Math I, MEE2007 Engineering Math II</td><td>9</td></tr>
<tr><td rowspan="2">Multiple (primary: ME)</td><td>PHY1001, PHY1002, PHY1101, STS2006, one of BIO1001 General Biology I / CHM1001</td><td>13</td><td rowspan="2">Total 22</td></tr>
<tr><td>MEE1006, MEE2006, MEE2007</td><td>9</td></tr>
<tr><td rowspan="3">Multiple (primary: other)</td><td>STS2005 Calculus I, STS2006 Calculus II</td><td>6</td><td>Additional requirement from the 2006 cohort onward</td></tr>
<tr><td>PHY1001, PHY1002, PHY1101, one of BIO1001 / CHM1001</td><td>10</td><td rowspan="2">Total 22 · MAT2410/2420 Applied Math I, II accepted as substitutes (Advanced Engineering Math I, II and Chemical Engineering Math I, II within the College of Engineering are mutually recognized)</td></tr>
<tr><td>MEE2006, MEE2007</td><td>6</td></tr>
</tbody></table>
<p class="text-[13.5px] text-sg-steel">※ Substitutions for SCIENCE-based Liberal Major required courses: SCI1011 Scientific Mathematics → STS2006 Calculus II / SCI1012 Integrated Physics → PHY1001 General Physics I / SCI1013 Integrated Chemistry → CHM1001 General Chemistry I / SCI1014 Integrated Biology → BIO1001 General Biology I</p>
<h3>Required major courses</h3>
<table><thead><tr><th>Track</th><th>Courses</th><th>Credits</th><th>Note</th></tr></thead><tbody>
<tr><td rowspan="2">Intensive</td><td>MEE2011 Solid Mechanics, MEE2012 Fluid Mechanics I, MEE2013 Dynamics, MEE2022 Thermodynamics I, MEE2025 Machine Shop Practice, MEE3004 Manufacturing Processes, MEE3015 Design Methodology (Capstone), MEE3025 ME Laboratory I, MEE4021 Creative Integrated Design (Capstone)</td><td>27</td><td rowspan="2">Up to 3 credits from MEE2014 / MEE3013 / MEE3032 count as required; any excess counts as elective</td></tr>
<tr><td>One of MEE2014 Engineering Materials / MEE3013 Automatic Control / MEE3032 Heat Transfer</td><td>3</td></tr>
<tr><td>Multiple (primary: ME)</td><td>The nine required courses above</td><td>27</td><td></td></tr>
<tr><td>Multiple (primary: other)</td><td>MEE2011, MEE2012, MEE2013, MEE2022, MEE2025, MEE3004, MEE3025</td><td>21</td><td></td></tr>
</tbody></table>
<h3>Other requirements</h3>
<ul>
<li>MEE4046 (Special Research) counts toward graduation but not toward major credits.</li>
<li>All first-year students must take COR1028 Albatross Seminar (ME section) in their first semester.</li>
<li>MEE3301/3302 Research Project I/II count up to 3 credits toward the major (if both are taken, the first counts as 3 major credits and the second as 3 general credits; students who earned 6 credits by Fall 2022 may count up to 6 as major credits).</li>
<li>When switching from intensive to multiple major, MEE1006 counts as a free elective.</li>
</ul>
<h2>3. Roadmap (intensive track)</h2>
<table><thead><tr><th>Area</th><th>Year 1</th><th>Year 2</th><th>Year 3</th><th>Year 4</th></tr></thead><tbody>
<tr><th>General</th><td colspan="4">Core humanities, Science Writing, Albatross Seminar, Calculus I, Basic AI Programming, one Global Language elective, one elective each from ① Humans &amp; Faith, ② Humans &amp; Thought, ③ Humans &amp; Society</td></tr>
<tr><th>Prerequisites</th><td>Calculus II, General Physics I·II &amp; Labs, General Chemistry I, Intro to Intelligent Mechanical Design &amp; Manufacturing</td><td>Engineering Math I, II</td><td></td><td></td></tr>
<tr><th>ME General</th><td></td><td></td><td>ME Lab I, Math for Machine Learning, ME Analysis, Research Project I</td><td>Creative Integrated Design, Automotive Engineering, ME Seminar, Research Project II</td></tr>
<tr><th>Design &amp; Materials</th><td></td><td>Solid Mechanics, Product Design Basics</td><td>Materials Behavior, Component Design, Finite Element Analysis, Design Methodology</td><td>Optimal Design, Biomechanics, Continuum Mechanics, DOE &amp; Statistics, Acoustics, Applied FEA, Materials Modeling &amp; Fatigue</td></tr>
<tr><th>Thermal-Fluids &amp; Energy</th><td></td><td>Thermodynamics I, Fluid Mechanics I</td><td>Thermodynamics II, Automotive Powertrain, Fluid Mechanics II, Heat Transfer, Refrigeration &amp; HVAC, Renewable Energy</td><td>Microscale Thermofluids, Thermal-Fluid System Design, CFD, Fuel Cells, Combustion &amp; Mass Transfer, Computational Heat Transfer, Statistical Thermodynamics, Advanced Heat Transfer</td></tr>
<tr><th>Control, Vibration &amp; Robotics</th><td></td><td>Dynamics</td><td>Vibrations, Automatic Control, Digital Control, Biomimetics, Mechatronics</td><td>Advanced Dynamics, Robot Design &amp; Control, Advanced Control I, System Modeling, Advanced Mechatronics</td></tr>
<tr><th>Manufacturing</th><td></td><td>Machine Shop Practice, Engineering Materials</td><td>Manufacturing Processes, CAD, Micro/Nano ME, Composites</td><td>MEMS Design, CAE for Process Design, Semiconductor Engineering, Mechanobiology, Nanotechnology</td></tr>
<tr><th>Internship</th><td></td><td></td><td colspan="2">ME Field Practice</td></tr>
</tbody></table>`,
  },
  'undergraduate/competency': {
    ko: `<table><thead><tr><th>전공능력</th><th>정의</th><th>하위능력</th></tr></thead><tbody>
<tr><th>지식 응용</th><td>수학, 기초과학, 공학의 지식과 정보기술을 기계공학 문제 해결에 응용할 수 있는 능력</td><td><ul><li>기계공학에서 활용되는 수학, 기초과학, 공학의 기본 원리를 선정하고 적용하는 능력</li><li>공학 실무에 필요한 기술, 방법, 도구 및 정보기술을 사용할 수 있는 능력</li><li>공학적 해결방안이 세계적, 경제적, 환경적, 사회적 상황에 끼치는 영향을 이해할 수 있는 능력</li></ul></td></tr>
<tr><th>문제 해결</th><td>기계공학 문제들을 인식하며, 이를 공식화하고 해결할 수 있는 능력</td><td><ul><li>공학 문제를 정의하고 수학적으로 공식화하고 해결할 수 있는 능력</li><li>직업적 책임과 윤리적 책임에 대한 인식</li><li>평생교육의 필요성에 대한 인식과 이에 능동적으로 참여할 수 있는 능력</li></ul></td></tr>
<tr><th>실험 분석</th><td>실험을 계획하고 수행하며 데이터를 이해하고 분석할 수 있는 능력</td><td><ul><li>기계공학 문제의 해결을 위해 실험을 계획하고 수행할 수 있는 능력</li><li>자료를 분석하여 인과관계를 도출할 수 있는 능력</li></ul></td></tr>
<tr><th>시스템 설계</th><td>기계공학의 현실적 제한조건을 반영하여 시스템, 요소, 공정을 설계할 수 있는 능력</td><td><ul><li>부품/시스템의 설계에서 목표설정, 상세설계, 평가의 과정을 수행할 수 있는 능력</li><li>공학 실무에 필요한 기술, 방법, 도구 및 정보기술을 사용할 수 있는 능력</li></ul></td></tr>
<tr><th>협업 및 의사전달</th><td>기계공학 문제를 해결하는 팀의 구성원으로서 성과에 기여할 수 있는 능력</td><td><ul><li>복합 학제적 팀의 구성원의 역할을 해낼 수 있는 능력</li><li>의사를 논리적으로 문서화하고 효과적으로 발표할 수 있는 능력</li></ul></td></tr>
</tbody></table>`,
    en: `<table><thead><tr><th>Competency</th><th>Definition</th><th>Sub-competencies</th></tr></thead><tbody>
<tr><th>Applying knowledge</th><td>Apply mathematics, basic science, engineering knowledge and IT to mechanical engineering problems</td><td><ul><li>Select and apply fundamental principles of math, science and engineering</li><li>Use the techniques, methods, tools and IT needed in practice</li><li>Understand the global, economic, environmental and social impact of engineering solutions</li></ul></td></tr>
<tr><th>Problem solving</th><td>Identify, formulate and solve mechanical engineering problems</td><td><ul><li>Define, mathematically formulate and solve engineering problems</li><li>Awareness of professional and ethical responsibility</li><li>Recognize the need for, and engage in, lifelong learning</li></ul></td></tr>
<tr><th>Experimental analysis</th><td>Plan and conduct experiments; understand and analyze data</td><td><ul><li>Plan and conduct experiments to solve ME problems</li><li>Analyze data to derive causal relationships</li></ul></td></tr>
<tr><th>System design</th><td>Design systems, components and processes under realistic constraints</td><td><ul><li>Set goals, carry out detailed design and evaluate components and systems</li><li>Use the tools and IT needed in practice</li></ul></td></tr>
<tr><th>Teamwork &amp; communication</th><td>Contribute as a member of a team solving ME problems</td><td><ul><li>Function on multidisciplinary teams</li><li>Document ideas logically and present effectively</li></ul></td></tr>
</tbody></table>`,
  },
  'undergraduate/activities': {
    ko: `<h2>학생회</h2>
<p>기계공학과 학생회는 기계공학과 학우들의 의견을 대변하고 학과의 발전을 위해 기계공학과 전 구성원들과 함께 가꾸어 가고 노력하는 자치적인 학생회입니다.</p>
<h3>주요 행사</h3>
<table><tbody>
<tr><th>3월 초</th><td>개강총회, 총MT</td></tr><tr><th>3월 중순</th><td>새내기 체육대회</td></tr><tr><th>3월 말</th><td>해오름제</td></tr>
<tr><th>5월</th><td>봄농활, 서서전, 대동제(주점)</td></tr><tr><th>6월</th><td>기계공학과 하계 워크샵</td></tr><tr><th>9월 말</th><td>단과대 축제</td></tr>
<tr><th>10월 말</th><td>서강문화제</td></tr><tr><th>11월</th><td>SOFEX(한-일 교류전), 홈커밍데이</td></tr><tr><th>12월</th><td>기계공학과 동계 워크샵</td></tr>
</tbody></table>
<h2>전공학회 MECHA</h2>
<p>MECHA는 서강대 기계공학과 전공학회로서 자동제어 이론을 관심 분야에 접목함으로써 좀더 인간 생활에 도움이 되는 제어 시스템을 구축하는 것에 목적을 두고 있는 학회입니다. 특히 로봇과 같은 시스템을 제작하고 제어 알고리즘을 적용하여 최상의 성능을 가지도록 하는 데 목표를 두고 있습니다.</p>
<p>기계공학 관점으로 제어에 대해 접근하려는 학생들이 모여서 이루어진 MECHA는 서강대학교 기계공학과의 탄생과 함께 시작하였습니다. 끊임없는 연구 활동은 물론이고 미래에 대한 도전 의식, 선후배간의 끈끈한 유대감, 우수한 학업성적이 자랑스러운 전통입니다. 현재 중점 연구 분야는 드론과 배틀 로봇으로, 각종 로봇 캠프 및 지능형 자동차 대회, 공모전 등에 참여하여 우수한 성적을 거두었습니다.</p>
<p>MECHA는 기계공학과 전공 학회이지만 전자공학과 컴퓨터공학 관련 지식도 반드시 필요로 합니다. 학회 활동은 학부생을 중심으로 이루어지며 대학원생들은 명예 회원으로서 학부생들의 연구와 실험에 도움을 주고 있습니다. 현 회원은 정회원(학부생)과 명예회원(학부졸업생), 군복무 중인 회원을 포함해 50~60명 정도입니다.</p>`,
    en: `<h2>Student Council</h2>
<p>The ME Student Council is an autonomous body that represents students' voices and works with every member of the department for its development.</p>
<h3>Annual events</h3>
<table><tbody>
<tr><th>Early March</th><td>Opening assembly, department retreat (MT)</td></tr><tr><th>Mid March</th><td>Freshman sports day</td></tr><tr><th>Late March</th><td>Haeoreum Festival</td></tr>
<tr><th>May</th><td>Spring rural volunteering, Sogang–Seoul games, Daedongje festival</td></tr><tr><th>June</th><td>ME Summer Workshop</td></tr><tr><th>Late September</th><td>College festival</td></tr>
<tr><th>Late October</th><td>Sogang Culture Festival</td></tr><tr><th>November</th><td>SOFEX (Korea–Japan exchange), Homecoming Day</td></tr><tr><th>December</th><td>ME Winter Workshop</td></tr>
</tbody></table>
<h2>MECHA — student engineering society</h2>
<p>MECHA is the department's academic society devoted to applying automatic control theory to areas of interest, building control systems that help people — in particular, building robotic systems and applying control algorithms for the best performance.</p>
<p>Founded together with the department, MECHA is known for continuous research, a spirit of challenge, close bonds between seniors and juniors, and strong academic records. Current focus areas are drones and battle robots, with strong results at robot camps, intelligent-vehicle competitions and contests.</p>
<p>Activities are led by undergraduates, with graduate students as honorary members supporting research and experiments. Membership is around 50–60 including regular members, honorary members and those on military service.</p>`,
  },
  'undergraduate/ureca': {
    ko: `<p class="text-lg"><strong>Undergraduate Research Experience on Campus, URECA</strong></p>
<p>기계공학과에서는 수업만으로 적성과 진로를 탐색하는 수동적인 교육방식에서 탈피하여, 학생들에게 연구 경험의 기회를 통하여 능동적으로 적성과 진로를 탐색하는 데 도움이 되도록 학부연구프로그램(URECA)을 제공하고 있습니다. URECA는 학생들이 부족한 정보와 타인의 조언만으로 적성에 맞지 않는 진로를 택하지 않도록 도와주며, 대학원 진학에 관심 있는 학생들에게는 연구 경험을 미리 제공하여 보다 성공적인 대학원 생활이 가능하도록 합니다. 특히 연구직에 관심이 있는 모든 학생들은 반드시 URECA를 활용할 것을 권장합니다.</p>
<p>URECA는 <strong>Intern</strong>과 <strong>Fellow</strong>의 두 가지 트랙으로 운영됩니다.</p>
<h2>URECA Intern</h2>
<ul>
<li>대학원 진학을 결심하지 못한 상태에서 연구 분야를 탐색하기 위한 프로그램입니다.</li>
<li>기계공학과 2학년(2학기 종료 후) 이상이면 누구나 지원 가능합니다.</li>
<li>1년에 4번, 겨울방학/봄학기/여름방학/가을학기 4개 텀으로 운영됩니다.</li>
<li>횟수와 관계없이 지원 가능하고, 한 연구실에 2텀까지 연속으로 참여할 수 있습니다. 2텀 이후 계속 한 연구실에서 인턴을 희망할 경우, 반드시 다른 연구실에서 1텀 이상 인턴을 수행한 후 복귀해야 합니다. (2학기 연속 한 연구실에서 인턴 수행 시 해당 연구실에 불이익이 가해질 수 있습니다.)</li>
<li>2텀 이후, 즉 6개월 이후 자동으로 인턴이 종료되므로 대학원 진학에 대한 의무가 발생하지 않습니다.</li>
<li>6학기를 마친 학생이 대학원 진학을 결심할 경우 URECA Fellow로 전환하여 계속 한 연구실에 참여할 수 있습니다.</li>
<li>2텀을 마친 후 교수님의 추천을 통하여 학과에서 발급하는 수료증을 받게 됩니다.</li>
</ul>
<p>URECA Intern은 텀으로 운영되는 순환(Rotation) 제도로서, 자유롭게 다양한 연구분야 및 연구환경을 경험해 볼 수 있는 기회를 제공합니다. 다만 학생들의 자유를 보장하기 위하여 학술제를 통한 상품 이외의 금전적 혜택은 제공되지 않습니다.</p>
<h2>URECA Fellow</h2>
<ul>
<li>서강대학교 기계공학과 대학원으로 진학을 확정한 경우, 해당 교수님과 협의하여 지원 가능합니다.</li>
<li>각 연구실과 교수님이 정한 의무와 권리, 금전적 지원범위에 따라 개별적으로 운영됩니다.</li>
<li>6학기를 종료한 이후(6학기를 마친 방학 시점부터) 지원 가능합니다.</li>
</ul>
<p>URECA Fellow는 사실상 대학원 진학으로 연결되므로 신중하게 결정해야 합니다. 일단 Fellow가 되면 연구실에서 정한 각종 혜택을 받을 수 있지만 그에 따른 의무가 발생합니다. 대학원 진학을 결심한 경우 미리 연구실 생활을 시작하여 해당 연구분야와 환경에 적응할 수 있고, 보다 성공적인 대학원 생활이 가능합니다.</p>
<p>기타 문의사항은 학과사무실(R618, 02-705-8631)로 문의하기 바랍니다.</p>`,
    en: `<p class="text-lg"><strong>Undergraduate Research Experience on Campus (URECA)</strong></p>
<p>URECA gives undergraduates real research experience so they can explore their aptitude and career actively, rather than through coursework alone. It helps students avoid choosing an ill-fitting path based on limited information, and gives those considering graduate school an early start toward a successful research career. All students interested in research careers are strongly encouraged to take part.</p>
<p>URECA runs on two tracks: <strong>Intern</strong> and <strong>Fellow</strong>.</p>
<h2>URECA Intern</h2>
<ul>
<li>For students who have not yet decided on graduate school and want to explore research fields.</li>
<li>Open to any ME student who has completed the second year.</li>
<li>Four terms per year: winter break, spring, summer break, fall.</li>
<li>Apply as often as you like; up to two consecutive terms in one lab. To continue in the same lab, complete at least one term in a different lab first.</li>
<li>The internship ends automatically after two terms (six months), with no obligation to enter graduate school.</li>
<li>Students who have completed six semesters and decide on graduate school may convert to URECA Fellow in the same lab.</li>
<li>A department certificate is issued after two terms on the professor's recommendation.</li>
</ul>
<p>The Intern track is a rotation system that lets you experience diverse research fields and environments freely. To protect that freedom, no financial benefits are provided beyond prizes at the research festival.</p>
<h2>URECA Fellow</h2>
<ul>
<li>For students who have confirmed admission to the Sogang ME graduate program, by agreement with the professor.</li>
<li>Operated individually according to the duties, rights and financial support set by each lab.</li>
<li>Available after completing six semesters.</li>
</ul>
<p>Because Fellow leads directly to graduate study, decide carefully. Fellows receive the lab's benefits and take on corresponding duties, and get an early start on adapting to their research field and lab.</p>
<p>Questions: Department office (R618, +82-2-705-8631).</p>`,
  },
};

export const calendar2026 = [
  { d: '2026-03-03', ko: '개강', en: 'Classes begin' }, { d: '2026-03-03 ~ 03-09', ko: '수강과목 확인 및 변경', en: 'Add/drop period' },
  { d: '2026-03-12', ko: '개강미사 (오전 10시 30분)', en: 'Opening Mass (10:30)' }, { d: '2026-03-30', ko: '수강과목 취소 마감', en: 'Course withdrawal deadline' },
  { d: '2026-04-02 ~ 04-03', ko: '부활절 휴가', en: 'Easter break' }, { d: '2026-04-18', ko: '개교기념일', en: 'Founding Anniversary' }, { d: '2026-04-21 ~ 04-27', ko: '중간시험', en: 'Midterm exams' },
  { d: '2026-05-01 ~ 05-31', ko: '2026학년도 2학기 장학금 신청', en: 'Fall 2026 scholarship applications' }, { d: '2026-05-06 ~ 05-19', ko: '전공 추가신청 및 변경', en: 'Major declaration / change' },
  { d: '2026-05-08', ko: '중간성적 제출 마감', en: 'Midterm grades due' }, { d: '2026-05-14 ~ 05-15', ko: '개교기념 축제', en: 'Anniversary festival' }, { d: '2026-05-22', ko: '휴학원서 제출 마감', en: 'Leave of absence deadline' },
  { d: '2026-06-16 ~ 06-22', ko: '학기말시험', en: 'Final exams' }, { d: '2026-06-21', ko: '종강미사 (오전 11시)', en: 'Closing Mass (11:00)' }, { d: '2026-06-23', ko: '여름방학 시작, 계절수업 개강', en: 'Summer break; summer session begins' },
  { d: '2026-06-30', ko: '학기말성적 제출 마감', en: 'Final grades due' }, { d: '2026-07-01 ~ 07-04', ko: '학기말성적 확인', en: 'Grade review' }, { d: '2026-07-13', ko: '계절수업 종강', en: 'Summer session ends' },
  { d: '2026-07-21', ko: '계절수업성적 제출 마감', en: 'Summer session grades due' }, { d: '2026-07-23 ~ 08-07', ko: '2026학년도 2학기 휴·복학 신청', en: 'Leave / return applications for Fall 2026' },
  { d: '2026-08-12 ~ 08-13', ko: '수강신청 과목 담아놓기', en: 'Course cart' }, { d: '2026-08-18', ko: '하계 졸업일', en: 'Summer graduation' },
  { d: '2026-08-19', ko: '1,2학년 수강신청', en: 'Registration (years 1–2)' }, { d: '2026-08-20', ko: '3,4학년 수강신청', en: 'Registration (years 3–4)' }, { d: '2026-08-25', ko: '전학년 수강신청', en: 'Registration (all years)' },
  { d: '2026-09-01', ko: '개강', en: 'Classes begin' }, { d: '2026-09-01 ~ 09-07', ko: '수강과목 확인 및 변경', en: 'Add/drop period' }, { d: '2026-09-10', ko: '개강미사 (오전 10시 30분)', en: 'Opening Mass' },
  { d: '2026-09-14 ~ 09-18', ko: '서강문화제: CARDINAL', en: 'Sogang Culture Festival: CARDINAL' }, { d: '2026-09-28', ko: '수강과목 취소 마감', en: 'Course withdrawal deadline' },
  { d: '2026-10-20 ~ 10-26', ko: '중간시험', en: 'Midterm exams' },
  { d: '2026-11-01 ~ 11-30', ko: '2027학년도 1학기 장학금 신청', en: 'Spring 2027 scholarship applications' }, { d: '2026-11-03', ko: '중간성적 제출 마감', en: 'Midterm grades due' },
  { d: '2026-11-04 ~ 11-17', ko: '전공 추가신청 및 변경', en: 'Major declaration / change' }, { d: '2026-11-20', ko: '휴학원서 제출 마감 · 스터디 데이(휴강일)', en: 'Leave of absence deadline · Study day (no classes)' },
  { d: '2026-12-15 ~ 12-21', ko: '학기말시험', en: 'Final exams' }, { d: '2026-12-20', ko: '종강미사 (오전 11시)', en: 'Closing Mass' }, { d: '2026-12-22', ko: '겨울방학 시작, 계절수업 개강', en: 'Winter break; winter session begins' },
  { d: '2026-12-29', ko: '학기말성적 제출 마감', en: 'Final grades due' }, { d: '2026-12-30 ~ 2027-01-02', ko: '학기말성적 확인', en: 'Grade review' },
  { d: '2027-01-08', ko: '스터디 데이_편입(휴강일)', en: 'Study day (no classes)' }, { d: '2027-01-14', ko: '계절수업 종강', en: 'Winter session ends' },
  { d: '2027-01-20 ~ 02-03', ko: '2027학년도 1학기 휴·복학 신청', en: 'Leave / return applications for Spring 2027' }, { d: '2027-01-21', ko: '계절수업성적 제출 마감', en: 'Winter session grades due' },
  { d: '2027-02-11 ~ 02-12', ko: '수강신청 과목 담아놓기', en: 'Course cart' }, { d: '2027-02-14', ko: '졸업감사미사 (오전 11시)', en: 'Graduation Mass' },
  { d: '2027-02-16', ko: '2,3학년 수강신청', en: 'Registration (years 2–3)' }, { d: '2027-02-17', ko: '4학년 수강신청', en: 'Registration (year 4)' },
  { d: '2027-02-18', ko: '제64회 학위수여식 (오전 10시)', en: '64th Commencement (10:00)' }, { d: '2027-02-19', ko: '입학식, 입학축복예식 (오후 3시)', en: 'Entrance ceremony (15:00)' },
  { d: '2027-02-20', ko: '신입생 수강신청', en: 'Freshman registration' }, { d: '2027-02-21 ~ 02-23', ko: '신입생 교외 오리엔테이션', en: 'Freshman orientation' }, { d: '2027-02-24', ko: '전학년 수강신청', en: 'Registration (all years)' },
];
