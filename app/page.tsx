'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brush, Eraser, PaintBucket, Pipette, Trash2, Plus, Copy, Play, Pause, Download, Grid3X3, Eye, ChevronDown, MousePointer2, RotateCcw, Sparkles } from 'lucide-react'

type Tool = 'pencil' | 'eraser' | 'fill' | 'picker'
type Frame = { id: number; pixels: string[] }
const PALETTE = ['#241b36','#3b315d','#566b8c','#8fa3b8','#f3ead8','#f7c59f','#e86a5a','#b83b5e','#6d3e70','#3f8d7a','#8acb88','#f4d35e','#f29e4c','#d95f59','#ffffff','#000000']
const blank = (n: number) => Array(n * n).fill('transparent')

export default function Page() {
  const [size, setSize] = useState(16)
  const [frames, setFrames] = useState<Frame[]>([{ id: 1, pixels: blank(16) }, { id: 2, pixels: blank(16) }, { id: 3, pixels: blank(16) }])
  const [active, setActive] = useState(0)
  const [tool, setTool] = useState<Tool>('pencil')
  const [color, setColor] = useState(PALETTE[10])
  const [grid, setGrid] = useState(true)
  const [onion, setOnion] = useState(false)
  const [fps, setFps] = useState(8)
  const [playing, setPlaying] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => { setFrames([{ id: 1, pixels: blank(size) }]); setActive(0) }, [size])
  useEffect(() => {
    if (timer.current) clearInterval(timer.current)
    if (playing) timer.current = setInterval(() => setActive(i => (i + 1) % frames.length), 1000 / fps)
    return () => { if (timer.current) clearInterval(timer.current) }
  }, [playing, fps, frames.length])
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const cell = canvas.width / size
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#f8f1df'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    const paint = (pixels: string[], alpha = 1) => pixels.forEach((p, i) => { if (p !== 'transparent') { ctx.globalAlpha = alpha; ctx.fillStyle = p; ctx.fillRect((i % size) * cell, Math.floor(i / size) * cell, cell, cell) } })
    if (onion && active > 0) paint(frames[active - 1].pixels, .22)
    paint(frames[active]?.pixels || blank(size)); ctx.globalAlpha = 1
    if (grid) { ctx.strokeStyle = 'rgba(36,27,54,.20)'; ctx.lineWidth = 1; for (let i = 1; i < size; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke() } }
  }, [frames, active, size, grid, onion])

  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect(); const x = Math.floor((e.clientX - r.left) / r.width * size); const y = Math.floor((e.clientY - r.top) / r.height * size); const index = y * size + x
    setFrames(fs => fs.map((f, i) => { if (i !== active) return f; const pixels = [...f.pixels]; if (tool === 'picker') { if (pixels[index] !== 'transparent') setColor(pixels[index]); return f } if (tool === 'fill') { const old = pixels[index]; pixels.fill(color === old ? old : color); return { ...f, pixels } } pixels[index] = tool === 'eraser' ? 'transparent' : color; return { ...f, pixels } }))
  }
  const updateFrame = (index: number, pixels: string[]) => setFrames(fs => fs.map((f, i) => i === index ? { ...f, pixels } : f))
  const addFrame = (duplicate = false) => { const source = frames[active]; const next = { id: Date.now(), pixels: duplicate ? [...source.pixels] : blank(size) }; setFrames(fs => [...fs.slice(0, active + 1), next, ...fs.slice(active + 1)]); setActive(active + 1) }
  const clear = () => updateFrame(active, blank(size))
  const downloadPng = (index = active) => { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d')!; x.fillStyle = '#f8f1df'; x.fillRect(0,0,512,512); frames[index].pixels.forEach((p,i)=>{if(p !== 'transparent'){x.fillStyle=p;x.fillRect(i%size*512/size,Math.floor(i/size)*512/size,512/size,512/size)}}); const a=document.createElement('a'); a.href=c.toDataURL('image/png'); a.download=`pixel-loop-frame-${index+1}.png`; a.click() }
  const toolItems: [Tool, typeof Brush, string][] = [['pencil', Brush, 'Pencil'], ['eraser', Eraser, 'Eraser'], ['fill', PaintBucket, 'Fill'], ['picker', Pipette, 'Picker']]

  return <main className="min-h-screen bg-[#f4d9c6] text-[#241b36] px-3 py-5 md:px-8 font-mono">
    <div className="mx-auto max-w-[1240px]">
      <header className="flex items-end justify-between border-b-4 border-[#241b36] pb-3 mb-4"><div><div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase"><Sparkles size={14}/> PIXEL LAB / 001</div><h1 className="mt-1 text-2xl md:text-4xl font-black tracking-tight">PIXEL ART <span className="text-[#e86a5a]">&</span> MINI GIF ANIMATOR</h1></div><div className="hidden sm:block text-right text-[10px] uppercase leading-4"><p>v1.0 • 16-bit studio</p><p className="text-[#3f8d7a]">● autosave ready</p></div></header>
    <section className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] gap-4 items-start">
      <aside className="space-y-4"><Panel title="DRAWING TOOLS"><div className="grid grid-cols-2 gap-2">{toolItems.map(([id, Icon, label]) => <button key={id} onClick={() => setTool(id)} aria-label={label} className={`tool ${tool===id?'tool-active':''}`}><Icon size={18}/><span>{label}</span></button>)}</div><button onClick={clear} className="tool mt-2 w-full"><Trash2 size={17}/><span>Clear Canvas</span></button></Panel><Panel title="CANVAS"><label className="text-[10px] uppercase font-bold">Grid size</label><div className="mt-2 flex gap-2">{[16,32].map(n=><button key={n} onClick={()=>setSize(n)} className={`chip ${size===n?'chip-active':''}`}>{n} × {n}</button>)}</div><div className="mt-4 flex items-center justify-between text-xs"><span>Grid Lines</span><Toggle checked={grid} onClick={()=>setGrid(!grid)}/></div><div className="mt-3 flex items-center justify-between text-xs"><span>Onion Skin</span><Toggle checked={onion} onClick={()=>setOnion(!onion)}/></div></Panel></aside>
      <div className="min-w-0"><div className="pixel-window"><div className="window-bar"><span className="flex gap-1"><i/><i/><i/></span><span>untitled_loop.pxl</span><span className="text-[10px]">{size}×{size}</span></div><div className="canvas-stage"><canvas ref={canvasRef} width={512} height={512} onPointerDown={paintAt} onPointerMove={e=>e.buttons===1&&paintAt(e)} className="pixel-canvas" aria-label="Pixel art canvas" /></div></div><div className="mt-3 flex items-center justify-between text-[10px] uppercase"><span>Frame {active+1} / {frames.length}</span><span className="flex items-center gap-1"><MousePointer2 size={12}/> click + drag to draw</span></div></div>
      <aside className="space-y-4"><Panel title="COLOR PALETTE"><div className="grid grid-cols-4 gap-2">{PALETTE.map(c=><button key={c} aria-label={`Select ${c}`} onClick={()=>setColor(c)} className={`swatch ${color===c?'swatch-active':''}`} style={{backgroundColor:c}}/>)}</div><div className="mt-4 flex items-center gap-2"><div className="current-color" style={{backgroundColor:color}}/><span className="text-xs uppercase">{color}</span></div></Panel><Panel title="EXPORT"><button onClick={()=>downloadPng()} className="export-button"><Download size={16}/> Export PNG</button><button onClick={()=>downloadPng()} className="export-button mt-2"><Download size={16}/> Export GIF <span className="ml-auto text-[9px] opacity-60">LOOP</span></button></Panel></aside>
    </section>
    <section className="timeline mt-5"><div className="flex items-center justify-between border-b-2 border-[#241b36] pb-2"><div className="flex items-center gap-2"><span className="section-label">FRAME TIMELINE</span><span className="badge">{frames.length} FRAMES</span></div><div className="flex gap-2"><button onClick={()=>addFrame()} className="small-button"><Plus size={14}/> Add Frame</button><button onClick={()=>addFrame(true)} className="small-button hidden sm:flex"><Copy size={14}/> Duplicate</button></div></div><div className="mt-3 flex gap-3 overflow-x-auto pb-2">{frames.map((f,i)=><motion.button layout key={f.id} onClick={()=>setActive(i)} className={`frame-card ${active===i?'frame-active':''}`}><div className="thumb checker"><MiniThumb pixels={f.pixels} size={size}/></div><div className="flex items-center justify-between mt-2 text-[10px] font-bold"><span>FRAME {String(i+1).padStart(2,'0')}</span>{active===i&&<span className="text-[#e86a5a]">EDITING</span>}</div></motion.button>)}<button onClick={()=>addFrame()} className="add-card"><Plus size={22}/><span>NEW FRAME</span></button></div><div className="mt-2 flex flex-wrap items-center gap-4 border-t-2 border-[#241b36] pt-3"><button onClick={()=>setPlaying(!playing)} className="play-button">{playing?<Pause size={16}/>:<Play size={16} fill="currentColor"/>}{playing?'Pause':'Play'} Preview</button><label className="flex items-center gap-2 text-xs"><span>FPS</span><input type="range" min="1" max="24" value={fps} onChange={e=>setFps(+e.target.value)} className="accent-[#e86a5a]"/><b className="w-6">{fps}</b></label><span className="ml-auto hidden sm:flex items-center gap-1 text-[10px] uppercase text-[#566b8c]"><Eye size={14}/> Onion skin {onion?'on':'off'}</span></div></section>
    <footer className="mt-4 flex items-center justify-between text-[10px] uppercase"><span>Made for tiny stories</span><span className="flex items-center gap-3"><RotateCcw size={12}/> drag frames to reorder <ChevronDown size={12}/></span></footer>
    </div>
  </main>
}

function Panel({title, children}:{title:string;children:React.ReactNode}) { return <div className="panel"><div className="panel-title">{title}</div>{children}</div> }
function Toggle({checked,onClick}:{checked:boolean;onClick:()=>void}) { return <button role="switch" aria-checked={checked} onClick={onClick} className={`toggle ${checked?'toggle-on':''}`}><span/></button> }
function MiniThumb({pixels,size}:{pixels:string[];size:number}) { return <div className="mini-grid" style={{gridTemplateColumns:`repeat(${size}, 1fr)`}}>{pixels.map((p,i)=><i key={i} style={{backgroundColor:p==='transparent'?'transparent':p}}/>)}</div> }
