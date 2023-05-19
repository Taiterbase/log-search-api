'use client';

import Image from 'next/image'
import { useState } from 'react';

const Header = () => {
  return (
    <div className=" flex flex-row justify-between px-4 z-10 w-full items-center font-mono text-sm backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800 dark:from-inherit">
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
  const [logs, setLogs] = useState([]);
  const [multi, setMulti] = useState(true);
  const [filename, setFilename] = useState("test_logs/BGL.log");
  const [last, setLast] = useState(1000);
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
        "cors": "no-cors"
      },
    });
    if (res.ok) {
      res.json().then(res => setLogs(res)).catch(err => console.log(err));
    } else {
      console.log(res);
    }
  }

  return (
    <main className="flex overflow-scroll min-h-screen flex-col items-center justify-between">
      <Header />
      <form onSubmit={fetchLogs} className="grid grid-cols-4 items-center h-16 w-9/12 mt-8 rounded shadow-md bg-slate-300" >
        <input className="" type="text" placeholder="filename" value={filename} onChange={(e) => setFilename(e.target.value)} />
        <input className="" type="number" placeholder="last" value={last} onChange={(e) => setLast(parseInt(e.target.value))} />
        <input className="" type="text" placeholder="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="" type="submit">Submit</button>
      </form>
      <div className="mb-8 md:mt-8 max-h-[52rem] flex flex-grow flex-col overflow-scroll text-neutral-300 shadow-2xl shadow-fuchsia-900 bg-neutral-700 place-items-center w-11/12 p-6 rounded-b-xl md:rounded-xl md:w-9/12">
        {
          // query the /logs endpoint and grab all the log files, then display them here
          logs && logs.map((log, index) => {
            return (
              <div key={index} className="flex flex-row justify-between w-full">
                <p className="text-sm font-bold">{log}</p>
              </div>
            )
          })
        }
      </div>
    </main >
  )
}
