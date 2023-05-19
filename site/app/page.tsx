'use client';

import Image from 'next/image'
import { useState } from 'react';

const Header = () => {
  return (
    <div className="flex flex-row justify-between px-4 z-10 w-full items-center font-mono text-sm backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800 dark:from-inherit">
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
    </div>
  )
}

export default function Home() {
  const [logs, setLogs] = useState<string[]>([]);
  const [multiLogs, setMultiLogs] = useState<string[][]>([]);
  const [multi, setMulti] = useState(true);
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
    const res = await fetch(`http://localhost:8080/${multi ? "multi_logs" : "logs"}?${queryParams}`, {
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
    <main className="flex overflow-scroll min-h-screen flex-col items-center justify-between">
      <Header />
      <form onSubmit={(e) => fetchLogs(e)} className="grid md:grid-cols-5 gap-y-4 md:gap-x-4 md:gap-y-0 my-4 p-4 items-center h-full w-9/12 mt-8 rounded shadow-md bg-neutral-100 px-8" >
        <input className="p-2 w-full rounded bg-white border border-neutral-700" type="text" placeholder="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
        <input className="p-2 w-full rounded bg-white border border-neutral-700" type="number" placeholder="last" value={last} onChange={(e) => setLast(parseInt(e.target.value))} />
        <input className="p-2 w-full rounded bg-white border border-neutral-700" type="text" placeholder="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <div className="flex flex-row justify-center space-x-4 h-6 items-center">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            checked={multi}
            onChange={(e) => setMulti(e.target.checked)}
          />
          <div className="text-sm leading-6">
            <label htmlFor="comments" className="font-medium text-gray-900">
              Multi Server
            </label>
          </div>
        </div>
        <button className="bg-neutral-400 h-12 rounded-xl hover:bg-neutral-300" type="submit">Submit</button>
      </form>

      <div className="mb-8 md:mt-8 h-[44rem] flex flex-col overflow-scroll text-neutral-300 shadow-2xl shadow-fuchsia-900 bg-neutral-700  w-11/12 p-6 rounded-b-xl rounded-xl md:w-9/12">
        {
          multi && multiLogs && multiLogs.map((l, i) => {
            return (
              <div key={i} className="flex flex-col">
                <h2 className="font-medium text-lg">Server&nbsp;{i}</h2>
                {
                  l.map((log, index) => {
                    return (
                      <pre key={`${i}+${index}`} className="text-left text-xs font-mono whitespace-pre-wrap">{log}</pre>
                    )
                  })
                }
              </div>
            )
          })
        }
        {
          !multi && logs && logs.map((l, index) => {
            return (
              <pre key={index} className="text-left text-xs font-mono whitespace-pre-wrap">{l}</pre>
            )
          })
        }
      </div>
    </main >
  )
}
