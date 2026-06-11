import { ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react'

const privacySections = [
  {
    title: '1. המידע שאנו אוספים והשימוש בו',
    paragraphs: [
      'VulanCore מיועדת לסייע בניהול תפעולי יעיל של עמותות ויוזמות קהילתיות. לצורך כך, המערכת מאפשרת להזין ולנהל את נתוני המידע הבאים:',
    ],
    items: [
      'נתוני מתנדבים: פרטי קשר ומידע רלוונטי לצורך שיוך למשימות (כגון שמות, סטטוס זמינות ופרטים תפעוליים).',
      'ניהול פעילות ומשימות: מידע אודות פעילויות הארגון, משימות מתוכננות, סטטוס ביצוע ונתונים המוצגים בדשבורד הניהולי.',
    ],
    after: [
      'כל המידע המוזן למערכת משמש אך ורק לצורך תפעול האפליקציה, הצגת תמונת המצב הניהולית בארגון שלכם ואספקת השירות התקין.',
    ],
  },
  {
    title: '2. אי-העברת מידע לצד שלישי',
    paragraphs: ['אנו מחויבים לשמירה קפדנית על סודיות המידע שלכם:'],
    items: [
      'שום פרט מידע (כולל רשימות מתנדבים, משימות או נתוני פעילות) אינו נמכר, מושכר, משותף או מועבר לגורמים חיצוניים או לצדדים שלישיים כלשהם למטרות שיווק, פרסום או כל מטרה אחרת.',
      'המידע נגיש אך ורק עבורכם ועבור הארגון שלכם לצורך הפעילות השוטפת.',
    ],
  },
  {
    title: '3. אבטחת מידע',
    paragraphs: [
      'אנו מפעילים אמצעי אבטחה מקובלים וסטנדרטיים כדי להגן על המידע השמור במערכת מפני גישה בלתי מורשית, שינוי, חשיפה או הרס.',
    ],
  },
  {
    title: '4. שינויים במדיניות הפרטיות',
    paragraphs: [
      'אנו שומרים לעצמנו את הזכות לעדכן את מדיניות הפרטיות מעת לעת. במידה ויבוצעו שינויים מהותיים, נעדכן על כך בעמוד זה או בתוך ממשק האפליקציה.',
    ],
  },
]

export function PrivacyPolicy({ onBackHome }) {
  const handleBackHome = (event) => {
    if (!onBackHome) return
    event.preventDefault()
    onBackHome()
  }

  return (
    <main
      dir="rtl"
      lang="he"
      className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.14),_transparent_34%),linear-gradient(135deg,_#eef6ff_0%,_#f8fafc_46%,_#fefce8_100%)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[linear-gradient(90deg,_rgba(14,116,144,0.12),_rgba(37,99,235,0.16),_rgba(250,204,21,0.14))] blur-3xl"
      />

      <article className="relative mx-auto flex w-full max-w-3xl flex-col gap-6">
        <a
          href="/"
          onClick={handleBackHome}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-blue-100 bg-white/82 px-4 py-2 text-sm font-semibold text-blue-800 shadow-line backdrop-blur transition hover:border-blue-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span>חזרה לדף הבית</span>
        </a>

        <div className="rounded-lg border border-white/80 bg-white/86 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 lg:p-10">
          <header className="mb-8 border-b border-slate-200 pb-6">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 ring-1 ring-blue-100">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>שמירה על פרטיות ונתונים</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              מדיניות פרטיות – VulanCore
            </h1>
            <p className="mt-3 text-sm font-medium text-slate-500">עדכון אחרון: יוני 2026</p>
            <p className="mt-6 text-lg leading-8 text-slate-700">
              ברוכים הבאים ל-VulanCore (להלן: "האפליקציה" או "השירות"), מערכת לניהול
              עמותות וצוותי מתנדבים המופעלת על ידי Frostig Knowledge Transfer.
            </p>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              הפרטיות שלכם ושל המתנדבים שלכם חשובה לנו מאוד. מסמך זה מפרט בצורה פשוטה
              ושקופה איזה מידע נשמר במערכת וכיצד נעשה בו שימוש.
            </p>
          </header>

          <div className="space-y-8">
            {privacySections.map((section) => (
              <section key={section.title} className="scroll-mt-8">
                <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                  {section.title}
                </h2>

                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph} className="mt-3 text-base leading-8 text-slate-700">
                    {paragraph}
                  </p>
                ))}

                {section.items?.length ? (
                  <ul className="mt-4 space-y-3 text-base leading-8 text-slate-700">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span
                          className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.after?.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-base leading-8 text-slate-700">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <section className="rounded-md border border-teal-100 bg-teal-50/70 p-5">
              <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                5. יצירת קשר
              </h2>
              <p className="mt-3 text-base leading-8 text-slate-700">
                לכל שאלה, הבהרה או בקשה בנוגע למדיניות הפרטיות והגנה על הנתונים שלכם,
                ניתן לפנות אלינו באמצעות אתר האינטרנט הרשמי:{' '}
                <a
                  href="https://vulancore.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-blue-800 underline-offset-4 hover:text-blue-950 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <span>vulancore.netlify.app</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </article>
    </main>
  )
}
