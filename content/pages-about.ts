import type { PageContent } from './types';

export const about: Record<string, PageContent> = {
  'about/goals': {
    ko: `
<p class="text-xl font-semibold text-sg-ink">"기계공학을 기반으로 다양한 분야에서의 종합적인 설계 및 신기술의 창조적 융합에 기여할 수 있는 독립성과 도전 정신, 봉사 정신을 갖춘 미래형 인재를 양성한다"</p>
<ul>
<li>가치 지향적 교육을 통해 남을 위하여 봉사하는 공학인 양성</li>
<li>기계공학을 기반으로 다양한 분야에서의 종합적인 설계 및 신기술의 창조적 융합을 이룰 수 있는 실력 있는 인재 양성</li>
<li>전공 분야에서의 탁월성, 판단력, 설득력 등을 골고루 갖추어 급변하는 사회에서 창의적으로 대응할 수 있는 미래형 인재 양성</li>
</ul>
<h2>교육목표 실천방안</h2>
<table><tbody>
<tr><th>창의성을 계발하는 교육</th><td>단편적인 부분 교육을 탈피하고, 시작(동기부여)과 종료(실질적인 성과)가 명확한 종합적 교육을 지향합니다.</td></tr>
<tr><th>사회와 연결된 실무형 교육</th><td>국가와 지역사회에 즉시 기여할 수 있는 실무형 교육을 강화합니다.</td></tr>
<tr><th>직접 참여하는 양방향 열린 교육</th><td>창의성과 개방성을 중시하는 교육을 강화합니다.</td></tr>
<tr><th>국가와 지역사회의 요구에 대한 부응</th><td>본 대학 교육목표의 최우선 순위는 "남을 위하여 봉사"하고 궁극적으로 "국가와 인류사회를 위한 연구와 실천"에 두고 있습니다.</td></tr>
</tbody></table>
<h2>학문분야의 발전계획과 특성화 방안</h2>
<ul>
<li>탈산업경제에 따른 시장변화를 수용하기 위하여, 고부가가치 상품개발에 대한 실용적이고 미래지향적인 교육 및 연구 강화</li>
<li>창의성과 개방성을 중시하는 교육 강화</li>
<li>국가와 지역사회에 즉시 기여할 수 있는 실무형 교육 강화</li>
</ul>
<h3>특성화 방안</h3>
<ul>
<li>기존의 단편적인 부분 교육을 탈피하고, 시작(동기부여)과 종료(실질적인 성과)가 명확한 종합적 교육을 지향</li>
<li>노동 생산성에 의존하던 산업사회로부터, 고부가가치 상품개발을 위한 실용적 교육 추구</li>
<li>기계공학 범위를 확장하여, 생명공학, 나노공학, 메카트로닉스 등이 융합된 신기술에 대한 교육 추구</li>
</ul>`,
    en: `
<p class="text-xl font-semibold text-sg-ink">"To cultivate future-oriented engineers with independence, a spirit of challenge and a commitment to service, who contribute to integrated design and the creative convergence of new technologies across fields, grounded in mechanical engineering."</p>
<ul>
<li>Engineers who serve others through value-oriented education</li>
<li>Competent professionals capable of integrated design and creative technology convergence across diverse fields</li>
<li>Future-oriented talent combining excellence, judgment and persuasiveness to respond creatively to a rapidly changing society</li>
</ul>
<h2>How we pursue these goals</h2>
<table><tbody>
<tr><th>Education that develops creativity</th><td>Moving beyond fragmented instruction toward integrated education with a clear start (motivation) and end (tangible outcomes).</td></tr>
<tr><th>Practice-oriented education connected to society</th><td>Strengthening hands-on education that contributes immediately to the nation and the community.</td></tr>
<tr><th>Open, participatory two-way education</th><td>Emphasizing creativity and openness.</td></tr>
<tr><th>Responding to national and regional needs</th><td>The University's first priority is "service to others" and ultimately "research and practice for the nation and humanity."</td></tr>
</tbody></table>
<h2>Development plan and specialization</h2>
<ul>
<li>Practical, future-oriented education and research on high-value product development, responding to the post-industrial economy</li>
<li>Education that prizes creativity and openness</li>
<li>Practice-oriented education that contributes immediately to the nation and the community</li>
</ul>
<h3>Specialization</h3>
<ul>
<li>Integrated education with clear motivation and measurable outcomes</li>
<li>Practical education for high-value product development</li>
<li>Expanding mechanical engineering into converged technologies such as biotechnology, nanotechnology and mechatronics</li>
</ul>`,
  },
  'about/intro': {
    ko: `
<h2>전공특성 — 기계공학 (Mechanical Engineering)</h2>
<p>공학이란 문자의 의미 그대로 무엇을 만들기 위한 원리 및 기술을 다루는 학문이고 공학의 기본 원리가 실체화된 것이 「기계」입니다. 즉, 기계공학은 시대의 발전에 따라 나타나는 새로운 과학적 원리를 인간을 위해 유용한 목적으로 사용될 수 있게 만드는 핵심적인 도구입니다. 좀더 빨리, 멀리 이동하고자 하는 인간의 꿈은 창조적인 기계공학자들의 노력을 통하여 자동차와 비행기로 실현되었고, 스마트폰, 태블릿PC, 초고화질 디스플레이 등 많은 새로운 제품이 탄생하는 데에도 기계공학은 중추적 역할을 해왔습니다. 이러한 이유에서 기계공학은 산업혁명 이래 꾸준하게 수요가 가장 많은 학문이었으며, 특정 산업의 흥망과 관련없이 공학 분야 중 항상 가장 중요한 위치를 차지하고 있습니다.</p>
<p>또한 기계공학은 모든 공학분야가 집결되어 인간의 생활에 편리함을 주는 설비와 기계장치를 개발하는 학문이므로 모든 산업의 기초가 되는 동시에 첨단 분야를 선도해 가고 있습니다. 따라서 공학 중의 공학이라고 불리기도 하며, 기계공학의 대상은 구체적이고 목표 지향적이므로 그 이론과 적용방법이 시류에 흔들리지 않고 굳건합니다.</p>
<h3>창의성과 상상력의 현실 구현 — 기계공학</h3>
<p>기계공학은 창의성과 상상력을 현실 구현하는 산실입니다. 첨단과학지식에 기반한 창의적 상상력을 현실 구현시키려고 진지하게 연구하는 기계공학도들의 모습 속에서 더 풍요로운 인류의 삶을 예견할 수 있습니다.</p>
<h3>없어서는 살 수 없는 우리 삶의 기본 — 기계산업</h3>
<p>풍요로운 삶과 번영된 세계는 땀 흘려 일하는 산업 현장에 의해서 지속되어 갑니다. 기계 산업은 우리 삶의 기본을 제공하는 실체이며 무한한 창의성과 상상력을 현실 구현하는 현장입니다.</p>
<h3>21세기를 새로운 세계로 바꾸어 나갈 힘 — 기계기술</h3>
<p>21세기 새로운 삶과 새 세계의 개척은 첨단과학지식을 현실 구현시키는 기계기술의 무한 도전에 의해서 이룩될 것입니다.</p>
<h2>미래비전</h2>
<ul>
<li><strong>첨단산업의 핵심기반 — 기계기술.</strong> 기계설계기술은 창의성 구현의 핵심원리를 제공함으로써 모든 첨단기술의 개발과 첨단산업 발전의 원동력이 됩니다.</li>
<li><strong>인류를 발전시킨 창의적 기계공학도.</strong> 문명 발달의 척도인 도구는 기계공학의 산물입니다. 최초로 비행기와 헬리콥터를 설계한 레오나르도 다빈치, 스트라디바리우스 바이올린을 제작한 안토니오 스트라디바리도 기계공학도였습니다.</li>
<li><strong>전체와 부분을 하나로 융합시키는 기계시스템기술.</strong> 원자력 발전소도, 철강 생산라인도, 반도체 제조라인도 모두 거대한 기계시스템입니다.</li>
<li><strong>첨단산업의 핵심기반기술 — 기계제작기술.</strong> 초정밀·지식정보화·사이버 제작기술은 반도체와 IT기기 제조를 위한 핵심기술입니다.</li>
</ul>
<h2>하나의 삶의 터전으로 바꾸는 기계공학 기술</h2>
<ul>
<li><strong>우주항공 기술</strong> — 극초음속 항공기와 우주항공기는 세계를 일일 생활권으로 만들 것이며, 기계공학·항공공학·통신제어공학의 융합으로 가능해집니다.</li>
<li><strong>해양개발 기술</strong> — 메카트로닉스, 신소재, 자동제어, 로봇, 조선 기술이 결합된 종합기술로 무한한 자원의 보고 해양을 우리 삶의 터전으로 바꾸어 갑니다.</li>
<li><strong>초고속 운송기</strong> — 초고속 전철, 선박, 항공기와 자기부상열차는 이 세계를 하나의 세계로 바꾸어 가는 견인차입니다.</li>
</ul>
<h2>졸업 후 진로</h2>
<p>졸업 후 진로는 크게 대학원 진학과 사회 진출로 나뉩니다. 기계공학 분야는 우수 인력에 대한 사회의 요구가 어느 분야보다 많고 지속적이어서, 원하는 분야로 진출하는 데 다른 전공보다 유리합니다. 졸업생들은 자동차, 항공우주, 환경/에너지, 전자/정보통신, 벤처기업 등에 진출해 활동하고 있으며, 환경·신에너지·생명공학·나노테크·메카트로닉스·첨단 의공학의 핵심에 있는 기계공학도는 현대산업사회의 미래를 개척하는 첨병 역할을 맡게 될 것입니다.</p>`,
    en: `
<h2>What is Mechanical Engineering?</h2>
<p>Engineering deals with the principles and techniques of making things, and a machine is the physical embodiment of those principles. Mechanical engineering is the essential tool that turns each era's new scientific discoveries into useful things for people. Humanity's dream of travelling faster and farther became the automobile and the aircraft through the work of creative mechanical engineers, and the discipline has been central to products you might not associate with it — smartphones, tablets and ultra-high-definition displays. It has been the most consistently in-demand engineering field since the Industrial Revolution, regardless of the rise and fall of individual industries.</p>
<p>Because it draws on every branch of engineering to build the equipment and devices that make life convenient, mechanical engineering is both the foundation of all industry and a leader in advanced fields — which is why it is sometimes called "the engineering of engineering." Its objects are concrete and goal-directed, so its theory and methods remain solid regardless of trends.</p>
<h3>Realizing creativity and imagination</h3>
<p>Mechanical engineering is where creativity and imagination become real. In students who work seriously to realize creative ideas grounded in advanced science, we can foresee a richer life for humanity.</p>
<h3>The foundation we cannot live without — machine industry</h3>
<p>Prosperity is sustained by industrial sites where people work. The machine industry provides the basis of our lives and is the place where limitless creativity is made real.</p>
<h3>The power to change the 21st century — machine technology</h3>
<p>New ways of living and new worlds in the 21st century will be pioneered by the unlimited challenge of machine technology that turns advanced knowledge into reality.</p>
<h2>Vision</h2>
<ul>
<li><strong>Core of advanced industry.</strong> Mechanical design technology provides the principles for realizing creativity and drives all advanced technology and industry.</li>
<li><strong>Creative engineers who advanced humanity.</strong> Tools, the measure of civilization, are products of mechanical engineering. Leonardo da Vinci, who first designed aircraft and helicopters, and Antonio Stradivari, who built the Stradivarius violin, were mechanical engineers.</li>
<li><strong>Systems technology that unifies the whole and its parts.</strong> Nuclear plants, steel production lines and semiconductor fabs are all vast mechanical systems.</li>
<li><strong>Advanced manufacturing technology.</strong> Ultra-precision, knowledge-based and cyber manufacturing are the core technologies behind semiconductor and IT device production.</li>
</ul>
<h2>Technologies that make the world one home</h2>
<ul>
<li><strong>Aerospace</strong> — hypersonic and aerospace vehicles will bring the world within a day's reach, enabled by the convergence of mechanical, aeronautical and control engineering.</li>
<li><strong>Ocean development</strong> — integrated technologies combining mechatronics, new materials, control, robotics and shipbuilding turn the ocean, a limitless resource, into our living space.</li>
<li><strong>High-speed transport</strong> — high-speed rail, ships, aircraft and maglev trains are the engines that make the world one.</li>
</ul>
<h2>Careers after graduation</h2>
<p>Graduates either continue to graduate school or enter industry. Demand for mechanical engineers is broader and more sustained than in any other field, giving our graduates an advantage in reaching the career they want. Alumni work in automotive, aerospace, environment and energy, electronics and IT, and start-ups. As environment, new energy, biotechnology, nanotechnology, mechatronics and biomedical engineering become mainstream, mechanical engineers at their core will pioneer the future of modern industrial society.</p>`,
  },
  'about/history': { ko: '', en: '' }, // rendered by a dedicated timeline component
  'about/location': { ko: '', en: '' },
};

export const history = [
  { y: '1993', m: '03', ko: '기계공학과 설립, 초대 학과장 이태수 교수', en: 'Department founded; Prof. Tae-Soo Lee named first chair' },
  { y: '1996', m: '03', ko: '기계·전자·전산 학부제 통합', en: 'Merged into the School of Mechanical, Electronic and Computer Engineering' },
  { y: '1997', m: '02', ko: '제1회 학사 졸업생 배출', en: 'First bachelor\'s graduates' },
  { y: '1997', m: '03', ko: '기계공학과 대학원 설립, 제2대 학과장 정시영 교수', en: 'Graduate program established; Prof. Si-Young Jeong, 2nd chair' },
  { y: '1998', m: '02', ko: '제1회 석사 졸업생 배출', en: 'First master\'s graduates' },
  { y: '1998', m: '03', ko: '기계공학과 박사과정 개설', en: 'Doctoral program opened' },
  { y: '1999', m: '02', ko: '기계·화공 학부로 변경', en: 'Reorganized as School of Mechanical and Chemical Engineering' },
  { y: '1999', m: '03', ko: '제3대 학과장 전도영 교수', en: 'Prof. Doyoung Jeon, 3rd chair' },
  { y: '2000', m: '08', ko: '제4대 학과장 허남건 교수', en: 'Prof. Nahmkeon Hur, 4th chair' },
  { y: '2002', m: '09', ko: '제5대 학과장 김남수 교수', en: 'Prof. Nam-Soo Kim, 5th chair' },
  { y: '2004', m: '08', ko: '제1회 박사 졸업생 배출', en: 'First doctoral graduates' },
  { y: '2004', m: '09', ko: '제6대 학과장 이형일 교수', en: 'Prof. Hyeong-Il Lee, 6th chair' },
  { y: '2005', m: '02', ko: '대학학문분야평가 우수학과 선정', en: 'Selected as an outstanding department in the national academic evaluation' },
  { y: '2006', m: '04', ko: '2단계 BK21 사업팀 선정', en: 'Selected for BK21 Phase 2' },
  { y: '2006', m: '09', ko: '제7대 학과장 이승엽 교수', en: 'Prof. Seung-Yop Lee, 7th chair' },
  { y: '2008', m: '09', ko: '제8대 학과장 허남건 교수', en: 'Prof. Nahmkeon Hur, 8th chair' },
  { y: '2010', m: '09', ko: '제10대 학과장 김낙수 교수', en: 'Prof. Naksoo Kim, 10th chair' },
  { y: '2012', m: '09', ko: '제11대 학과장 정현용 교수', en: 'Prof. Hyun-Yong Jeong, 11th chair' },
  { y: '2013', m: '05', ko: '2012년 산업계 관점 대학평가 기계분야 최우수 대학 평가 획득', en: 'Rated top university in mechanical engineering, 2012 Industry-Perspective University Evaluation' },
  { y: '2014', m: '09', ko: '제12대 학과장 손기헌 교수', en: 'Prof. Gihun Son, 12th chair' },
  { y: '2016', m: '03', ko: 'BK21플러스 사업팀 선정', en: 'Selected for BK21 PLUS' },
  { y: '2016', m: '08', ko: '제13대 학과장 이철수 교수', en: 'Prof. Cheol-Soo Lee, 13th chair' },
  { y: '2018', m: '09', ko: '제14대 학과장 박정열 교수', en: 'Prof. Jungyul Park, 14th chair' },
  { y: '2020', m: '09', ko: '제15대 학과장 신충수 교수', en: 'Prof. Choongsoo Shin, 15th chair' },
  { y: '2020', m: '09', ko: '4단계 BK21사업 교육연구팀 선정', en: 'Selected for BK21 FOUR' },
  { y: '2022', m: '09', ko: '제16대 학과장 김동철 교수', en: 'Prof. Dongchoul Kim, 16th chair' },
  { y: '2024', m: '09', ko: '제17대 학과장 강성원 교수', en: 'Prof. Sungwon Kang, 17th chair' },
  { y: '2026', m: '09', ko: '제18대 학과장 김남근 교수', en: 'Prof. Namkeun Kim, 18th chair' },
];
