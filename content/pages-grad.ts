import type { PageContent } from './types';

export const researchAreas = [
  { id: 'design', ko: '설계 및 재료역학 분야', en: 'Design & Materials Mechanics',
    // 연구실 수는 글에 적지 않는다 — 페이지가 교수진(DB)에서 센 실제 수를 제목 옆에 보여 주므로 교수 변동 때 글과 어긋났다(2026-10-13)
    descKo: '기계부품이나 구조를 설계하고 그 수명(내구성), 안전성 및 신뢰도를 해석하고 예측하며 실험과 계산을 통하여 이를 검증하는 분야입니다.',
    descEn: 'Designs machine components and structures, analyzes and predicts their life, safety and reliability, and verifies them through experiment and computation.',
  },
  { id: 'thermal', ko: '열, 유체 및 에너지 분야', en: 'Thermal, Fluids & Energy',
    descKo: '에너지가 어떻게 변환되고, 유체가 어떻게 흐르며, 열이 어떻게 전달되는지를 탐구하는 학문입니다. 전기자동차·드론·로봇에 들어가는 고출력 이차전지, 반도체 공정의 정밀 세정 기술, 그리고 AI 시대의 핵심 인프라인 데이터센터의 냉각 시스템까지 첨단 기술의 한복판에는 언제나 열과 유체의 문제가 자리하고 있습니다. 최근에는 전산유체역학과 전산열전달, AI 기반 설계 및 공정 최적화를 적극 활용하여 차세대 에너지 시스템과 열관리 기술의 혁신을 이끄는 융합 연구로 영역을 넓혀가고 있습니다. 시뮬레이션과 실험을 아울러 이론·전산·실험을 폭넓게 경험할 수 있는 환경을 제공합니다.',
    descEn: 'Studies how energy is converted, how fluids flow and how heat is transferred — from high-power batteries in EVs, drones and robots, to precision cleaning in semiconductor fabs and cooling for AI data centers. Increasingly uses CFD, computational heat transfer and AI-based design and process optimization to drive next-generation energy and thermal-management systems. Laboratories span simulation and experiment, offering broad exposure to theory, computation and experiment.',
    // 교과목은 국문·영문 함께 — 영문 페이지에만 빠져 있던 것(2026-10-13). 다른 세 분야의 대학원 교과목 목록은 학과에서 받는 대로 추가
    courses: '열역학I, 유체역학I, 열역학II, 자동차동력공학, 유체역학II, 열전달, 냉동 및 공기조화, 신재생에너지공학개론, 미소열유체역학, 열유체시스템설계, 전산유체역학, 연료전지개론, 미소열유체공학, 연소및물질전달, 전산열전달, 통계열역학 및 미소열전달, 고급열전달',
    coursesEn: 'Thermodynamics I, Fluid Mechanics I, Thermodynamics II, Automotive Powertrain Engineering, Fluid Mechanics II, Heat Transfer, Refrigeration & Air Conditioning, Introduction to Renewable Energy Engineering, Microscale Thermofluid Mechanics, Thermal-Fluid System Design, Computational Fluid Dynamics, Introduction to Fuel Cells, Microscale Thermofluid Engineering, Combustion & Mass Transfer, Computational Heat Transfer, Statistical Thermodynamics & Microscale Heat Transfer, Advanced Heat Transfer',
  },
  { id: 'control', ko: '제어, 진동, 로보틱스 분야', en: 'Control, Vibration & Robotics',
    descKo: '로봇, 컴퓨터 수치제어식 공작기계, 메카트로닉스 시스템 등을 해석하고 고속·고정밀 움직임을 위한 제어기 및 자동차, 항공기, 로봇 및 기계류의 진동현상을 해석하고 이를 최소화하기 위한 설계 및 능동 제어를 연구합니다. 또한 바이오 응용 연구로 다양한 생체 모방 로봇 및 센서, 액츄에이터를 개발하는 연구 및 의공학 응용 바이오 시스템 및 매니퓰레이션 관련 연구를 새롭게 시작하고 있습니다.',
    descEn: 'Analyzes robots, CNC machine tools and mechatronic systems; develops controllers for high-speed, high-precision motion; analyzes and actively suppresses vibration in vehicles, aircraft, robots and machinery. Also develops biomimetic robots, sensors and actuators, and biomedical manipulation systems.',
  },
  { id: 'manufacturing', ko: '생산공학 분야', en: 'Manufacturing Engineering',
    descKo: '기계장치 및 제품을 생산하는 기술 및 배경학문의 모임으로서 전통재료 및 첨단 재료의 가공과 설계, 최신의 미소가공(micro-mechanics), 초정밀 가공 및 레이저가공과 같은 특수 가공이 포함됩니다. 최근에는 나노 공정 및 나노 구조물의 자기조립과 관련된 연구를 수행하고 있으며, 생산·조립·공정 자동화를 위하여 인공지능(AI), 전문가 시스템 등을 활용하는 분야입니다.',
    descEn: 'The technologies and sciences of producing machines and products: processing and design of conventional and advanced materials, micro-mechanics, ultra-precision and laser machining, nano-processes and self-assembly of nanostructures, and AI and expert systems for production and assembly automation.',
  },
];


export const graduate: Record<string, PageContent> = {
  'graduate/admission': {
    ko: `<p>서강대학교 기계공학과 대학원은 세계적인 연구-교육 역량을 지닌 교수들과 뛰어난 잠재 역량을 갖춘 대학원생, 연구원 및 연구교수들로 구성되어 있습니다. 대학원생들은 여러 대기업, 벤처기업, 각종 정부 부처, 정부 연구소 등과의 협력 연구 프로젝트를 수행하며 졸업 후 대학의 교수, 산업체 연구소와 정부출연 연구소 등지에서 엘리트로서 활약할 수 있는 미래형 인재로 양성되고 있습니다.</p>
<p>다양한 시청각 자료를 활용한 양질의 강의를 통하여 최첨단 지식을 교육받으며 이론과 실기를 겸비한 고급 인력으로 성장합니다. 연구-교육 활동을 지원하기 위한 다양한 장학금 제도가 완비되어 대부분의 대학원생들이 금전적 부담 없이 연구와 공부에 집중할 수 있는 환경을 갖추고 있습니다.</p>
<h3>연구 분야</h3>
<p>자동차, 로봇, 바이오기계, 에너지기계, 항공우주, 조선해양 등 다양한 기계산업 분야에서 요구되는 최적설계, 생체역학, 전산역학, 파괴역학, 차량역학, 기계신뢰성공학, 열공학, 냉동공조, 유체공학, 전산유체역학, 열전달, 다상유동, 미소유체공학, 연료전지, 로봇공학, 메카트로닉스, 진동소음, 정보저장공학, 나노바이오시스템, 랩온어칩, 정형가공, 생산공정, MEMS, 미세가공, 나노역학, 구조물해석 등</p>
<p>상당한 규모의 연구비로 세계 최고 수준의 연구를 수행하고 있으며, 연구재단을 포함한 정부 주관 연구사업 이외에도 다양한 산업체와 산학협력연구를 추진하고 서강미래기술연구소(SIAT)와도 긴밀한 협조 체제를 갖추고 있습니다. 산학협력연구를 통하여 학위를 받는 즉시 해당 산업체로 취직하는 경우도 많습니다.</p>
<h2>입학전형</h2>
<p>입학 전형은 <strong>특별전형</strong>과 <strong>일반전형</strong>으로 나누어지며, 가장 큰 차이점은 영어시험의 유무입니다. 학과 차원의 면접(구술시험)은 두 전형 모두 해당됩니다.</p>
<ul>
<li>지원자는 응용수학, 고체역학, 열역학, 동역학, 유체역학 등 기계공학 기본 지식에 대해 30분여에 걸쳐 복수의 교수와의 구술시험으로 평가받습니다.</li>
<li>타 전공 학사학위 지원자는 연구 희망 분야 관련 질문을 주로 받으나, 석박사 취득에 기본적으로 필요한 기계공학 지식에 대해서도 질문받습니다.</li>
<li>긴 계산이 아닌 기본 개념의 이해도를 평가하며, 특히 창의력과 잠재역량 평가에 주안점을 둡니다.</li>
</ul>
<p>합격자는 학기 시작 전이라도 각 연구실에서 실질적인 지원을 받으며 연구를 시작할 수 있습니다(조기 연구 개시). 지원 내용과 범위는 교수님마다 다를 수 있으므로 반드시 해당 교수님께 문의하시기 바랍니다. 입학 후 모든 대학원생은 지도교수를 정하고 각 연구실에 소속되어 연구·교육 활동에 매진합니다.</p>
<p>전형 일정과 제출 서류 등은 대학원 홈페이지를 확인하시기 바랍니다.</p>
<p><a href="https://gradsch.sogang.ac.kr" target="_blank" rel="noreferrer" class="btn-primary !no-underline !text-white">대학원 입학안내 바로가기 →</a></p>`,
    en: `<p>The Sogang ME graduate program brings together faculty with world-class research and teaching capabilities and graduate students, researchers and research professors of outstanding potential. Students carry out collaborative projects with major companies, start-ups, government ministries and national laboratories, and go on to positions as professors and elite researchers in industry and government institutes.</p>
<p>A comprehensive scholarship system means most graduate students can focus on research and study without financial burden.</p>
<h3>Research fields</h3>
<p>Optimal design, biomechanics, computational mechanics, fracture mechanics, vehicle dynamics, reliability engineering, thermal engineering, refrigeration and HVAC, fluid engineering, CFD, heat transfer, multiphase flow, microfluidics, fuel cells, robotics, mechatronics, vibration and noise, information storage, nano-biosystems, lab-on-a-chip, net-shape manufacturing, manufacturing processes, MEMS, micromachining, nanomechanics and structural analysis — serving the automotive, robotics, biomedical, energy, aerospace and marine industries.</p>
<p>Substantial research funding supports world-class research, including government programs, industry collaborations and close cooperation with the Sogang Institute of Advanced Technology (SIAT). Many students move directly into the partner company upon graduation.</p>
<h2>Admission</h2>
<p>Admission is through a <strong>special track</strong> or a <strong>general track</strong>; the main difference is whether an English test is required. Both tracks include a department oral examination.</p>
<ul>
<li>Applicants are assessed for about 30 minutes by several professors on fundamentals: applied mathematics, solid mechanics, thermodynamics, dynamics and fluid mechanics.</li>
<li>Applicants from other disciplines are asked mainly about their intended research area, plus the ME fundamentals needed for graduate study.</li>
<li>Questions test conceptual understanding rather than long calculations, with emphasis on creativity and potential.</li>
</ul>
<p>Admitted students may begin research in their lab with support before the semester starts (early research start); details vary by advisor. After enrollment every student selects an advisor and joins a laboratory.</p>
<p><a href="https://gradsch.sogang.ac.kr" target="_blank" rel="noreferrer" class="btn-primary !no-underline !text-white">Graduate School admissions →</a></p>`,
  },
  'graduate/curriculum': {
    ko: `<h2>석사학위 과정</h2>
<table><thead><tr><th>전공필수</th><th>전공선택</th><th>총 취득학점</th><th>종합시험</th><th>영어시험</th></tr></thead><tbody><tr><td>-</td><td>24</td><td>24 (6)</td><td>있음</td><td>없음</td></tr></tbody></table>
<p class="text-[13px] text-sg-steel">( ) 안의 숫자는 연구학점으로 이수 가능한 최대 학점</p>
<h3>커리큘럼</h3>
<ul><li>본 학과 교과 과목 중에서 24학점 이상 취득. 학과장 승인 시 24학점 중 12학점까지 타 대학 혹은 타 학과 대학원 교과목에서 취득 가능</li><li>연구학점은 6학점까지 이수 가능</li><li>학석사공용과목은 9학점까지 졸업소요학점에 포함 가능</li><li>본교 학부생으로서 학석사공용과목을 이수하여 성적이 B0 이상인 경우 대학원 이수학점으로 9학점까지 중복 인정 (2020년 3월 입학생부터 적용)</li></ul>
<h3>자격시험</h3>
<ul><li>석사학위과정 종합시험에 합격하여야 함. 학과 개설 전공과목 중 3과목 선택 (시험 1주 전까지 해당 교수에게 통보)</li><li>합격·불합격은 과목별로 평가하며, 불합격 과목은 1회에 한하여 응시학기에 재응시 가능</li></ul>
<h3>논문</h3>
<ul><li>최종심사 전까지 제1저자로서 SCI(E) 논문투고, 국내 논문게재(게재 예정 증명 가능), 국제 및 국내 저명 학술대회 발표 중 하나 이상 만족</li><li>석사학위 논문은 심사위원회의 심사를 통과하여야 함</li><li>연구과제 수행 실적, 특허, 기타 학과 교수회의에서 인정받은 공학적 활동으로 학위논문을 대체 가능 (학과 교수 3분의 2 이상 인정 후 심사위원회 최종 평가)</li></ul>
<h2>박사학위 과정</h2>
<table><thead><tr><th>전공필수</th><th>전공선택</th><th>총 취득학점</th><th>종합시험</th><th>영어시험</th><th>학술지 게재</th></tr></thead><tbody><tr><td>-</td><td>24</td><td>24 (6)</td><td>있음</td><td>없음</td><td>SCI(E)급 2편 이상</td></tr></tbody></table>
<h3>커리큘럼</h3>
<ul><li>24학점 이상 취득. 학과장 승인 시 12학점까지 타 대학·타 학과 대학원 교과목 가능</li><li>연구학점 6학점까지, 학과장 승인 시 학석사공용과목 9학점까지 포함 가능</li></ul>
<h3>자격시험</h3>
<ul><li>박사학위과정 종합시험 합격 (전공과목 3과목 선택, 과목별 평가, 불합격 과목 1회 재응시 가능)</li></ul>
<h3>논문</h3>
<ul><li>논문 제출일 최소 6개월 전까지 박사학위 논문신청(proposal) 시험을 치러야 하며 불합격 시 다음 학기에 재시험</li><li>최종심사 전까지 SCI(E) 2편 이상 제1저자 게재 논문(또는 게재예정 증명서) 제출</li><li>박사학위 논문은 모두 영문으로 작성</li><li>심사위원회 구성은 대학원 규정에 따름</li></ul>
<h2>석·박사 통합 과정</h2>
<table><thead><tr><th>전공필수</th><th>전공선택</th><th>총 취득학점</th><th>종합시험</th><th>영어시험</th><th>학술지 게재</th></tr></thead><tbody><tr><td>-</td><td>42</td><td>42 (6)</td><td>있음</td><td>없음</td><td>SCI(E)급 2편 이상</td></tr></tbody></table>
<ul><li>42학점 이상 취득. 학과장 승인 시 21학점까지 타 대학·타 학과 대학원 교과목 가능</li><li>연구학점 6학점까지, 학석사공용과목 9학점까지 포함 가능</li><li>자격시험 및 논문 요건은 박사학위 과정과 동일</li></ul>
<p class="text-[13px] text-sg-steel">입학 자격과 입학시험은 대학원 학칙에 준하며, 본 규정에 정의되어 있지 않은 사항은 서강대학교 대학원 학칙 및 시행세칙에 따릅니다.</p>`,
    en: `<h2>Master's program</h2>
<table><thead><tr><th>Required</th><th>Elective</th><th>Total credits</th><th>Comprehensive exam</th><th>English exam</th></tr></thead><tbody><tr><td>-</td><td>24</td><td>24 (6)</td><td>Yes</td><td>No</td></tr></tbody></table>
<p class="text-[13px] text-sg-steel">Figures in parentheses: maximum research credits</p>
<h3>Curriculum</h3>
<ul><li>At least 24 credits from department courses; with the chair's approval up to 12 may come from other departments or universities</li><li>Up to 6 research credits</li><li>Up to 9 credits of combined undergraduate/graduate courses may count toward graduation</li><li>Sogang undergraduates who earned B0 or higher in combined courses may double-count up to 9 credits (from March 2020 entrants)</li></ul>
<h3>Qualifying exam</h3>
<ul><li>Pass the master's comprehensive exam in three department courses of your choice (notify the professors one week before the exam)</li><li>Graded per course; a failed course may be retaken once in the same semester</li></ul>
<h3>Thesis</h3>
<ul><li>Before the final defense, as first author: submit an SCI(E) paper, publish (or have accepted) a domestic journal paper, or present at a major conference</li><li>The thesis must pass the examination committee</li><li>Equivalent achievements (project results, patents, other engineering work approved by two-thirds of the faculty) may substitute for the thesis</li></ul>
<h2>Doctoral program</h2>
<table><thead><tr><th>Required</th><th>Elective</th><th>Total credits</th><th>Comprehensive exam</th><th>English exam</th><th>Publications</th></tr></thead><tbody><tr><td>-</td><td>24</td><td>24 (6)</td><td>Yes</td><td>No</td><td>2+ SCI(E) papers</td></tr></tbody></table>
<h3>Curriculum</h3>
<ul><li>At least 24 credits; up to 12 from other departments with approval</li><li>Up to 6 research credits; up to 9 combined-course credits with approval</li></ul>
<h3>Qualifying exam</h3>
<ul><li>Pass the doctoral comprehensive exam (three courses, graded per course, one retake allowed)</li></ul>
<h3>Dissertation</h3>
<ul><li>Pass the proposal exam at least six months before submission (retake next semester if failed)</li><li>Submit two or more first-author SCI(E) papers (published or accepted) before the final defense</li><li>The dissertation must be written in English</li><li>Committee composition follows Graduate School regulations</li></ul>
<h2>Integrated MS–PhD program</h2>
<table><thead><tr><th>Required</th><th>Elective</th><th>Total credits</th><th>Comprehensive exam</th><th>English exam</th><th>Publications</th></tr></thead><tbody><tr><td>-</td><td>42</td><td>42 (6)</td><td>Yes</td><td>No</td><td>2+ SCI(E) papers</td></tr></tbody></table>
<ul><li>At least 42 credits; up to 21 from other departments with approval</li><li>Up to 6 research credits; up to 9 combined-course credits</li><li>Exam and dissertation requirements are the same as the doctoral program</li></ul>
<p class="text-[13px] text-sg-steel">Admission eligibility and examinations follow Graduate School regulations; matters not defined here follow the Sogang University Graduate School rules and bylaws.</p>`,
  },
};
