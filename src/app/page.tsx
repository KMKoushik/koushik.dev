import Image from "next/image";
import CopyCommand from "~/components/CopyCommand";

export default function Home() {
  return (
    <main className="min-h-screen bg-ctp-base text-ctp-text">
      <div className="mx-auto max-w-2xl px-5 py-16 space-y-10">
        <section className="space-y-3">
          <Image
            src="https://avatars.githubusercontent.com/u/24666922?s=400&u=2f9bdbf04ee806afa8a7153a1924696024e4c87c&v=4"
            alt="koushik mohan"
            width={80}
            height={80}
            priority
            className="rounded-full w-20 h-20 object-cover"
          />
          <h1 className="text-3xl text-ctp-mauve mt-8">koushik mohan</h1>
          <p className="">
            i build apps on weekdays and open source apps on weekends
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-ctp-subtext0 text-sm">
            open source
          </h2>
          <ul className="text space-y-1 text-sm">
            <li>
              <a
                className="text-ctp-mauve"
                href="https://github.com/usesend/usesend"
                target="_blank"
                rel="noreferrer"
              >
                useSend
              </a>
              {", "}
              an open source email platform
            </li>
            <li>
              <a
                className="text-ctp-mauve"
                href="https://splitpro.app/"
                target="_blank"
                rel="noreferrer"
              >
                splitpro
              </a>
              {", "}
              an open source splitwise alternative
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-ctp-subtext0 text-sm">work</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <a
                className="text-ctp-mauve"
                href="https://raindrop.ai"
                target="_blank"
                rel="noreferrer"
              >
                raindrop
              </a>
              {", "}founding engineer
            </li>
            <li>
              <a
                className="text-ctp-mauve"
                href="https://opyn.co"
                target="_blank"
                rel="noreferrer"
              >
                opyn
              </a>
              {", "}frontend tech lead
            </li>
            <li>
              <a
                className="text-ctp-mauve"
                href="https://zoho.com"
                target="_blank"
                rel="noreferrer"
              >
                zoho
              </a>
              {", "}software engineer
            </li>
          </ul>
          <h2 className="font-semibold text-ctp-subtext0 text-sm mt-8">
            contact
          </h2>
          <p className="text-ctp-subtext1 mt-1 text-sm">
            <a className="text-ctp-mauve" href="mailto:hey@koushik.dev">
              email
            </a>
            {" · "}
            <a
              className="text-ctp-mauve"
              href="https://x.com/KM_Koushik_"
              target="_blank"
              rel="noreferrer"
            >
              x
            </a>
            {" · "}
            <a
              className="text-ctp-mauve"
              href="https://github.com/KMKoushik"
              target="_blank"
              rel="noreferrer"
            >
              github
            </a>
            {" · "}
            <a
              className="text-ctp-mauve"
              href="https://www.linkedin.com/in/koushik-mohan/"
              target="_blank"
              rel="noreferrer"
            >
              linkedin
            </a>
          </p>

          <div className="mt-8 space-y-2">
            <h3 className="text-xs font-semibold text-ctp-subtext0">
              also try
            </h3>
            <CopyCommand command="curl https://koushik.dev" />
          </div>
        </section>
      </div>
    </main>
  );
}
