/**
 * About Us page for Idexal Agents.
 * Displays information about the platform and its founder.
 */

import { useState } from 'react'

type Language = 'en' | 'ar' | 'zh'

interface AboutContent {
  title: string
  subtitle: string
  mission: string
  missionDescription: string
  leadership: string
  founder: string
  founderRole: string
  founderBio: string
  founderBioDetail: string
  values: string
  value1Title: string
  value1Desc: string
  value2Title: string
  value2Desc: string
  value3Title: string
  value3Desc: string
  contact: string
  website: string
  email: string
  github: string
  platform: string
  platformDesc: string
  version: string
  license: string
  copyright: string
  poweredBy: string
}

const translations: Record<Language, AboutContent> = {
  en: {
    title: 'About Idexal Agents',
    subtitle: 'AI-powered IDE for every developer',
    mission: 'Our Mission',
    missionDescription: 'Idexal Agents is an open-source, AI-powered IDE that competes with the best proprietary solutions — accessible to every developer on every platform. We believe in making world-class developer tools accessible to everyone.',
    leadership: 'Leadership',
    founder: 'Zakariae Lahbabi',
    founderRole: 'Founder, CEO & Lead Developer',
    founderBio: 'The Vision Behind Idexal',
    founderBioDetail: 'Passionate about building world-class developer tools. Zakariae founded Idexal with the mission of creating an open-source, AI-powered IDE that competes with the best proprietary solutions — accessible to every developer on every platform.',
    values: 'Our Values',
    value1Title: 'Open Source',
    value1Desc: 'We believe in transparency and community-driven development. Our code is open for everyone to inspect, contribute to, and build upon.',
    value2Title: 'Accessibility',
    value2Desc: 'World-class tools should be available to every developer, regardless of their platform or background.',
    value3Title: 'Innovation',
    value3Desc: 'We constantly push the boundaries of what\'s possible with AI-powered development tools.',
    contact: 'Contact',
    website: 'Website',
    email: 'Email',
    github: 'GitHub',
    platform: 'Platform',
    platformDesc: 'Idexal Agents - Open-source AI-powered IDE',
    version: 'Version',
    license: 'License',
    copyright: '© 2026 Idexal. All rights reserved.',
    poweredBy: 'Built with ❤️ by Idexal',
  },
  ar: {
    title: 'عن Idexal Agents',
    subtitle: 'بيئة تطوير ذكاء اصطناعي مفتوحة المصدر لكل مطور',
    mission: 'مهمتنا',
    missionDescription: 'Idexal Agents هو بيئة تطوير مفتوحة المصدر ومدعومة بالذكاء الاصطناعي ت competes مع أفضل الحلول المملوكة — متاحة لكل مطور على كل منصة. نحن نؤمن بجعل أدوات التطوير العالمية متاحة للجميع.',
    leadership: 'القيادة',
    founder: 'Zakariae Lahbabi',
    founderRole: 'المؤسس، الرئيس التنفيذي والرئيس المطور',
    founderBio: 'الرؤية وراء Idexal',
    founderBioDetail: 'شغوف ببناء أدوات تطوير عالمية المستوى. أسس Zakariae Idexal بهدف إنشاء بيئة تطوير مفتوحة المصدر ومدعومة بالذكاء الاصطناعي ت competes مع أفضل الحلول المملوكة — متاحة لكل مطور على كل منصة.',
    values: 'قيمنا',
    value1Title: 'مفتوح المصدر',
    value1Desc: 'نؤمن بالشفافية والتطوير المدفوع بالمجتمع. كودنا مفتوح للجميع لل Peek والمساهمة والبناء عليه.',
    value2Title: 'إمكانية الوصول',
    value2Desc: 'الأدوات العالمية يجب أن تكون متاحة لكل مطور، بغض النظر عن منصته أو خلفيته.',
    value3Title: 'الابتكار',
    value3Desc: 'ندفع باستمرار حدود ما هو ممكن مع أدوات التطوير المدعومة بالذكاء الاصطناعي.',
    contact: 'التواصل',
    website: 'الموقع الإلكتروني',
    email: 'البريد الإلكتروني',
    github: 'GitHub',
    platform: 'المنصة',
    platformDesc: 'Idexal Agents - بيئة تطوير ذكاء اصطناعي مفتوحة المصدر',
    version: 'الإصدار',
    license: 'الرخصة',
    copyright: '© 2026 Idexal. جميع الحقوق محفوظة.',
    poweredBy: 'صنع بـ ❤️ بواسطة Idexal',
  },
  zh: {
    title: '关于 Idexal Agents',
    subtitle: '面向每位开发者的开源 AI 驱动 IDE',
    mission: '我们的使命',
    missionDescription: 'Idexal Agents 是一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。我们致力于让世界级的开发工具对每个人都可用。',
    leadership: '领导团队',
    founder: 'Zakariae Lahbabi',
    founderRole: '创始人、CEO 首席开发',
    founderBio: 'Idexal 背后的愿景',
    founderBioDetail: '热衷于构建世界级的开发工具。Zakariae 创立了 Idexal，使命是创建一个开源的 AI 驱动的 IDE，与最好的专有解决方案竞争——让每个开发者在每个平台上都能使用。',
    values: '我们的价值观',
    value1Title: '开源',
    value1Desc: '我们相信透明度和社区驱动的开发。我们的代码对每个人开放，可以检查、贡献和构建。',
    value2Title: '可访问性',
    value2Desc: '世界级工具应该对每位开发者可用，无论其平台或背景如何。',
    value3Title: '创新',
    value3Desc: '我们不断推动 AI 驱动开发工具的可能性边界。',
    contact: '联系我们',
    website: '网站',
    email: '电子邮件',
    github: 'GitHub',
    platform: '平台',
    platformDesc: 'Idexal Agents - 开源 AI 驱动的 IDE',
    version: '版本',
    license: '许可证',
    copyright: '© 2026 Idexal. 保留所有权利。',
    poweredBy: '由 Idexal 用心打造 ❤️',
  },
}

export function AboutUs() {
  const [language, setLanguage] = useState<Language>('en')
  const t = translations[language]

  return (
    <div className={`about-us ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Language Selector */}
      <div className="language-selector">
        <button
          className={language === 'en' ? 'active' : ''}
          onClick={() => setLanguage('en')}
        >
          English
        </button>
        <button
          className={language === 'ar' ? 'active' : ''}
          onClick={() => setLanguage('ar')}
        >
          العربية
        </button>
        <button
          className={language === 'zh' ? 'active' : ''}
          onClick={() => setLanguage('zh')}
        >
          中文
        </button>
      </div>

      {/* Header */}
      <div className="about-header">
        <div className="logo-container">
          <img src="/logo.png" width="80" height="80" alt="Idexal Logo" aria-hidden="true" />
          <h1>{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
      </div>

      {/* Mission */}
      <section className="about-section">
        <h2>{t.mission}</h2>
        <p>{t.missionDescription}</p>
      </section>

      {/* Leadership */}
      <section className="about-section leadership">
        <h2>{t.leadership}</h2>
        <div className="founder-card">
          <div className="founder-avatar">
            <span className="initials">ZL</span>
          </div>
          <div className="founder-info">
            <h3>{t.founder}</h3>
            <p className="role">{t.founderRole}</p>
            <p className="bio-title">{t.founderBio}</p>
            <p className="bio">{t.founderBioDetail}</p>
            <div className="contact-links">
              <a href="https://zakariaelahbabi.com" target="_blank" rel="noopener noreferrer">
                🌐 zakariaelahbabi.com
              </a>
              <a href="mailto:info@zakariaelahbabi.com">
                ✉️ info@zakariaelahbabi.com
              </a>
              <a href="https://github.com/idexal" target="_blank" rel="noopener noreferrer">
                ⚡ GitHub @idexal
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="about-section values">
        <h2>{t.values}</h2>
        <div className="values-grid">
          <div className="value-card">
            <h3>{t.value1Title}</h3>
            <p>{t.value1Desc}</p>
          </div>
          <div className="value-card">
            <h3>{t.value2Title}</h3>
            <p>{t.value2Desc}</p>
          </div>
          <div className="value-card">
            <h3>{t.value3Title}</h3>
            <p>{t.value3Desc}</p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="about-section contact">
        <h2>{t.contact}</h2>
        <div className="contact-grid">
          <a href="https://agents.idexal.com" className="contact-item" target="_blank" rel="noopener noreferrer">
            <span className="icon">🌐</span>
            <span className="label">{t.website}</span>
            <span className="value">agents.idexal.com</span>
          </a>
          <a href="mailto:agents@idexal.com" className="contact-item">
            <span className="icon">✉️</span>
            <span className="label">{t.email}</span>
            <span className="value">agents@idexal.com</span>
          </a>
          <a href="https://github.com/idexal" className="contact-item" target="_blank" rel="noopener noreferrer">
            <span className="icon">⚡</span>
            <span className="label">{t.github}</span>
            <span className="value">@idexal</span>
          </a>
        </div>
      </section>

      {/* Platform Info */}
      <section className="about-section platform-info">
        <h2>{t.platform}</h2>
        <p>{t.platformDesc}</p>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">{t.version}:</span>
            <span className="value">0.1.2-alpha</span>
          </div>
          <div className="info-item">
            <span className="label">{t.license}:</span>
            <span className="value">MIT</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="about-footer">
        <p>{t.copyright}</p>
        <p className="powered-by">{t.poweredBy}</p>
      </div>

      <style>{`
        .about-us {
          padding: 32px;
          max-width: 800px;
          margin: 0 auto;
          font-family: var(--font-family, system-ui, -apple-system, sans-serif);
          color: var(--text-primary, #1a1a1a);
        }

        .about-us.rtl {
          direction: rtl;
          text-align: right;
        }

        .about-us.rtl .contact-links a,
        .about-us.rtl .contact-grid {
          flex-direction: row-reverse;
        }

        .language-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          justify-content: center;
        }

        .language-selector button {
          padding: 8px 16px;
          border: 1px solid var(--border-color, #e0e0e0);
          border-radius: 6px;
          background: var(--bg-secondary, #f5f5f5);
          cursor: pointer;
          transition: all 0.2s;
        }

        .language-selector button:hover {
          background: var(--hover-bg, #e5e5e5);
        }

        .language-selector button.active {
          background: var(--primary-color, #2563eb);
          color: white;
          border-color: var(--primary-color, #2563eb);
        }

        .about-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .logo-container h1 {
          margin: 0;
          font-size: 2rem;
          color: var(--text-primary, #1a1a1a);
        }

        .subtitle {
          margin: 0;
          font-size: 1.125rem;
          color: var(--text-secondary, #666);
        }

        .about-section {
          margin-bottom: 48px;
        }

        .about-section h2 {
          margin: 0 0 16px 0;
          font-size: 1.5rem;
          color: var(--text-primary, #1a1a1a);
          border-bottom: 2px solid var(--primary-color, #2563eb);
          padding-bottom: 8px;
        }

        .about-section p {
          margin: 0 0 16px 0;
          line-height: 1.6;
          color: var(--text-secondary, #444);
        }

        .founder-card {
          display: flex;
          gap: 24px;
          padding: 24px;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 12px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .founder-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--primary-color, #2563eb);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .initials {
          font-size: 2rem;
          font-weight: 700;
          color: white;
        }

        .founder-info h3 {
          margin: 0 0 4px 0;
          font-size: 1.25rem;
          color: var(--text-primary, #1a1a1a);
        }

        .founder-info .role {
          margin: 0 0 12px 0;
          color: var(--primary-color, #2563eb);
          font-weight: 500;
        }

        .founder-info .bio-title {
          margin: 0 0 8px 0;
          font-style: italic;
          color: var(--text-secondary, #666);
        }

        .founder-info .bio {
          margin: 0 0 16px 0;
          color: var(--text-secondary, #444);
        }

        .contact-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contact-links a {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-primary, #1a1a1a);
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .contact-links a:hover {
          background: var(--hover-bg, #e5e5e5);
        }

        .values-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .value-card {
          padding: 20px;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
        }

        .value-card h3 {
          margin: 0 0 8px 0;
          font-size: 1.125rem;
          color: var(--primary-color, #2563eb);
        }

        .value-card p {
          margin: 0;
          font-size: 0.9375rem;
          color: var(--text-secondary, #444);
        }

        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .contact-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background: var(--bg-secondary, #f8f9fa);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e0e0e0);
          text-decoration: none;
          transition: all 0.2s;
        }

        .contact-item:hover {
          border-color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f0f4ff);
        }

        .contact-item .icon {
          font-size: 1.5rem;
          margin-bottom: 8px;
        }

        .contact-item .label {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          margin-bottom: 4px;
        }

        .contact-item .value {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .platform-info .info-grid {
          display: flex;
          gap: 24px;
        }

        .info-item {
          display: flex;
          gap: 8px;
        }

        .info-item .label {
          color: var(--text-secondary, #666);
        }

        .info-item .value {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .about-footer {
          text-align: center;
          padding-top: 32px;
          border-top: 1px solid var(--border-color, #e0e0e0);
        }

        .about-footer p {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #666);
        }

        .powered-by {
          font-size: 0.875rem;
          color: var(--text-secondary, #999);
        }

        @media (max-width: 640px) {
          .about-us {
            padding: 16px;
          }

          .founder-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .contact-links {
            align-items: center;
          }
        }

        @media (prefers-color-scheme: dark) {
          .about-us {
            --bg-secondary: #252525;
            --text-primary: #ffffff;
            --text-secondary: #a0a0a0;
            --border-color: #333333;
            --hover-bg: #2a2a2a;
          }
        }
      `}</style>
    </div>
  )
}

export default AboutUs
