'use client';

import Image from 'next/image'
import clsx from 'clsx';
import { useState } from 'react';

const Header = () => {
  return (
    <section about="Header" className="sticky top-0 flex flex-row justify-between px-4 z-10 w-full items-center font-mono text-sm backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800 dark:from-inherit">
      <Image
        src={'/cribl.svg'}
        alt="Cribl Logo"
        width={100}
        height={100}
        className="w-auto h-20"
        priority
      />
      <p className="static w-auto rounded-xl border bg-gray-200 p-4 flex justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-300 dark:from-inherit">
        by&nbsp;
        <code className="font-mono font-bold"><a
          className="pointer-events-auto flex place-items-center gap-2 p-0"
          href="https://zifilabs.com/"
          target="_blank"
          rel="noopener noreferrer"
        >Taite</a></code>
      </p>
    </section>
  )
}

function LogDisplay({ logs, serverIndex }: { logs: string[], serverIndex?: number }) {
  return (
    <div className={clsx({
      "flex-1 max-h-[70vh] p-2 rounded": serverIndex === undefined,
      "flex-1 max-h-[25vh] overflow-auto bg-neutral-800 p-2 rounded": serverIndex !== undefined,
    })}>
      {serverIndex !== undefined && <h3 className="font-medium text-lg">Server&nbsp;{serverIndex}</h3>}
      {
        logs.map((log, index) => (
          <pre key={`${serverIndex}+${index}`} className="text-left text-xs font-mono whitespace-pre-wrap">{log}</pre>
        ))
      }
    </div>
  );
}


export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [multiLogs, setMultiLogs] = useState<string[][]>([]);
  const [multi, setMulti] = useState(false);
  const [filename, setFilename] = useState("");
  const [last, setLast] = useState(10);
  const [keyword, setKeyword] = useState("");

  const fetchLogs = async (e: any) => {
    e.preventDefault();
    let queryParams = new URLSearchParams({
      filename: filename,
      last: last.toString(),
      keyword: keyword,
    })
    const res = await fetch(`http://localhost:8080/${multi ? "multi-logs" : "logs"}?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      res.json().then(res => {
        if (multi) {
          setMultiLogs(res.map(JSON.parse))
        } else {
          setLogs(res)
        }
      }).catch(err => {
        console.log(err)
      });
    } else {
      console.error(res);
    }
  }

  return (
    <main className="flex flex-col w-full h-full overflow-auto min-h-screen items-center">
      <Header />
      <form onSubmit={(e) => fetchLogs(e)} className="mx-auto grid md:grid-cols-5 gap-y-4 md:gap-x-4 md:gap-y-0 my-4 p-4 items-center h-full w-11/12 md:w-9/12 mt-8 rounded-xl shadow-md bg-neutral-100 px-8" >
        <label htmlFor="filename" className="sr-only">Filename</label>
        <input className="p-2 w-full rounded bg-white border border-neutral-700" id="filename" type="text" aria-label="filename" placeholder="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />

        <label htmlFor="last" className="sr-only">Last</label>
        <input className="p-2 w-full rounded bg-white border border-neutral-700" id="last" type="number" aria-label="last-n" placeholder="last" value={last} onChange={(e) => setLast(parseInt(e.target.value))} />

        <label htmlFor="keyword" className="sr-only">Keyword</label>
        <input className="p-2 w-full rounded bg-white border border-neutral-700" id="keyword" type="text" aria-label="keyword" placeholder="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

        <div className="flex flex-row justify-center space-x-4 h-6 items-center">
          <div className="text-sm leading-6">
            <label htmlFor="comments" className="font-medium text-gray-900">
              Multi Server
            </label>
          </div>
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            checked={multi}
            onChange={(e) => setMulti(e.target.checked)}
          />
        </div>
        <button className="bg-neutral-400 h-12 rounded-xl hover:bg-neutral-300" type="submit">Submit</button>
      </form>

      <div className="flex-grow overflow-auto grid gap-y-2 mx-auto mb-8 md:mt-8 rounded-xl text-neutral-300 shadow-2xl shadow-fuchsia-900 bg-neutral-700 w-11/12 p-3">
        {
          multi && multiLogs && multiLogs.map((logs, serverIndex) => (
            <LogDisplay key={serverIndex} logs={logs} serverIndex={serverIndex} />
          ))
        }
        {
          !multi && logs && <LogDisplay logs={logs} />
        }
      </div>
    </main >
  )
}
