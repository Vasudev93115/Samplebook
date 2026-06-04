import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Sun, Moon, MessageSquare, Check, ArrowRight, Wallet, 
  Brain, BarChart3, Users, HelpCircle, Sparkles, Plus, Play, 
  Info, CheckSquare, Zap, Shield, ArrowUpRight, Mic, Image, 
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useGroup } from '../hooks/useGroup';

// ==========================================
// UPGRADED 3D LEDGER GLOBE CANVAS BACKGROUND
// ==========================================
function ThreeDCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // Dynamic scale helper
    let sizeFactor = Math.min(width, height) / 1000;
    
    // 3D Sphere Point Generator (Ledger Core)
    const globePoints = [];
    const sphereRadius = 110 * Math.max(0.75, sizeFactor);
    const rings = 8;
    const segments = 14;

    for (let r = 0; r <= rings; r++) {
      const theta = (r * Math.PI) / rings;
      const sinTheta = Math.sin(theta);
      const cosTheta = Math.cos(theta);

      for (let s = 0; s < segments; s++) {
        const phi = (s * 2 * Math.PI) / segments;
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        globePoints.push({
          x: sphereRadius * sinTheta * cosPhi,
          y: sphereRadius * sinTheta * sinPhi,
          z: sphereRadius * cosTheta,
          ring: r,
          segment: s,
        });
      }
    }

    // Orbiting particles (Expense Orbits)
    const orbitCount = 18;
    const orbitParticles = [];
    for (let i = 0; i < orbitCount; i++) {
      orbitParticles.push({
        angle: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.015,
        radius: sphereRadius * (1.2 + Math.random() * 0.8),
        yHeight: (Math.random() - 0.5) * 80,
        tiltX: (Math.random() - 0.5) * 0.4,
        tiltY: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2.5 + 1.5,
      });
    }

    // Outer background star dust particles
    const starCount = 35;
    const starParticles = [];
    for (let i = 0; i < starCount; i++) {
      starParticles.push({
        x: (Math.random() - 0.5) * width * 0.95,
        y: (Math.random() - 0.5) * height * 0.95,
        z: (Math.random() - 0.5) * 500,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        vz: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5,
      });
    }

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left - width / 2;
      mouseRef.current.y = e.clientY - rect.top - height / 2;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Slow rotation parameters
    let thetaX = 0;
    let thetaY = 0;
    let thetaZ = 0;

    const isDark = () => document.documentElement.classList.contains('dark');

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const dark = isDark();

      // Soft palette matching SampleBook's styles
      const activeColor = dark ? '#10b981' : '#1a6b47';
      const coreColor = dark ? 'rgba(52, 211, 153, 0.08)' : 'rgba(26, 107, 71, 0.04)';
      const wireframeColor = dark ? 'rgba(52, 211, 153, 0.14)' : 'rgba(26, 107, 71, 0.09)';
      const starColor = dark ? 'rgba(52, 211, 153, 0.65)' : 'rgba(26, 107, 71, 0.55)';
      const orbitColor = dark ? 'rgba(52, 211, 153, 0.9)' : 'rgba(45, 148, 98, 0.8)';
      const shadowColor = dark ? '#10b981' : '#1a6b47';

      // Increment rotation speeds
      thetaX += 0.002;
      thetaY += 0.003;
      thetaZ += 0.001;

      // Base matrix trigonometric variables
      const cosX = Math.cos(thetaX);
      const sinX = Math.sin(thetaX);
      const cosY = Math.cos(thetaY);
      const sinY = Math.sin(thetaY);
      const cosZ = Math.cos(thetaZ);
      const sinZ = Math.sin(thetaZ);

      const focalLength = 400;

      // Centered position (offset slightly to right on large desktop screens)
      const centerOffsetX = width > 768 ? width * 0.18 : 0;
      const centerY = height / 2;
      const centerX = width / 2 + centerOffsetX;

      // ------------------------------------------
      // 1. Rotate & Project Ledger Globe Wireframe
      // ------------------------------------------
      const projectedGlobe = globePoints.map((pt) => {
        // Rotate Z
        let x1 = pt.x * cosZ - pt.y * sinZ;
        let y1 = pt.y * cosZ + pt.x * sinZ;
        let z1 = pt.z;

        // Rotate Y
        let x2 = x1 * cosY - z1 * sinY;
        let z2 = z1 * cosY + x1 * sinY;

        // Rotate X
        let y3 = y1 * cosX - z2 * sinX;
        let z3 = z2 * cosX + y1 * sinX;

        // Mouse Attraction morphing
        if (mouseRef.current.active) {
          const mX = mouseRef.current.x - centerOffsetX;
          const mY = mouseRef.current.y;
          const dx = mX - x2;
          const dy = mY - y3;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const pull = (150 - dist) * 0.12;
            x2 += (dx / dist) * pull;
            y3 += (dy / dist) * pull;
          }
        }

        // Project
        const zDepth = z3 + 400;
        const scale = focalLength / zDepth;
        const scrX = centerX + x2 * scale;
        const scrY = centerY + y3 * scale;

        return {
          x: scrX,
          y: scrY,
          z: z3,
          ring: pt.ring,
          segment: pt.segment,
        };
      });

      // ------------------------------------------
      // 2. Draw Ledger Core Background Shadow Disk
      // ------------------------------------------
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreColor;
      ctx.fill();

      // ------------------------------------------
      // 3. Draw Wireframe Latitudes & Longitudes
      // ------------------------------------------
      ctx.strokeStyle = wireframeColor;
      ctx.lineWidth = 0.8;

      // Draw latitude connections
      for (let r = 0; r <= rings; r++) {
        ctx.beginPath();
        for (let s = 0; s < segments; s++) {
          const idx = r * segments + s;
          const pt = projectedGlobe[idx];
          if (!pt) continue;
          if (s === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        // Connect back to start of ring
        const ptStart = projectedGlobe[r * segments];
        if (ptStart) ctx.lineTo(ptStart.x, ptStart.y);
        ctx.stroke();
      }

      // Draw longitude connections (connecting adjacent rings)
      for (let s = 0; s < segments; s++) {
        ctx.beginPath();
        for (let r = 0; r <= rings; r++) {
          const idx = r * segments + s;
          const pt = projectedGlobe[idx];
          if (!pt) continue;
          if (r === 0) {
            ctx.moveTo(pt.x, pt.y);
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      // ------------------------------------------
      // 4. Draw Orbiting Expense Particles
      // ------------------------------------------
      for (let i = 0; i < orbitParticles.length; i++) {
        const o = orbitParticles[i];
        o.angle += o.speed;

        // Position on 3D ellipse
        let xBase = Math.cos(o.angle) * o.radius;
        let zBase = Math.sin(o.angle) * o.radius;
        let yBase = o.yHeight;

        // Apply tilt
        let x1 = xBase;
        let y1 = yBase * Math.cos(o.tiltX) - zBase * Math.sin(o.tiltX);
        let z1 = zBase * Math.cos(o.tiltX) + yBase * Math.sin(o.tiltX);

        let x2 = x1 * Math.cos(o.tiltY) - z1 * Math.sin(o.tiltY);
        let z2 = z1 * Math.cos(o.tiltY) + x1 * Math.sin(o.tiltY);

        // Project
        const zDepth = z2 + 400;
        const scale = focalLength / zDepth;
        const scrX = centerX + x2 * scale;
        const scrY = centerY + y1 * scale;

        // Render point
        ctx.beginPath();
        ctx.arc(scrX, scrY, Math.max(1, o.size * scale), 0, Math.PI * 2);
        ctx.fillStyle = orbitColor;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = o.size > 2 ? 8 : 0;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Orbit trail
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.arc(scrX, scrY, o.size * scale * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = dark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(26, 107, 71, 0.1)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      // ------------------------------------------
      // 5. Draw Ambient Background Star Dust
      // ------------------------------------------
      for (let i = 0; i < starParticles.length; i++) {
        const s = starParticles[i];

        // Float movement
        s.x += s.vx;
        s.y += s.vy;
        s.z += s.vz;

        if (Math.abs(s.x) > width / 2) s.vx *= -1;
        if (Math.abs(s.y) > height / 2) s.vy *= -1;
        if (Math.abs(s.z) > 250) s.vz *= -1;

        // Project star coords
        const zDepth = s.z + 400;
        const scale = focalLength / zDepth;
        const scrX = centerX + s.x * scale;
        const scrY = centerY + s.y * scale;

        ctx.beginPath();
        ctx.arc(scrX, scrY, Math.max(0.5, s.size * scale), 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      sizeFactor = Math.min(width, height) / 1000;
    };
    window.addEventListener('resize', handleResize);

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}

// ==========================================
// FEATURE CARD WITH 3D TILT EFFECT
// ==========================================
function FeatureCard({ icon: Icon, title, description, index }) {
  const cardRef = useRef(null);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 12; 
    const rotateY = ((x - centerX) / centerX) * 12; 

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`,
      transition: 'transform 0.08s ease',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className="glass-card group p-8 rounded-2xl border border-border/80 flex flex-col items-start gap-4 transition-all duration-300 relative overflow-hidden reveal-on-scroll"
      data-delay={index * 150}
    >
      <div className="absolute -right-12 -bottom-12 w-36 h-36 bg-green/5 rounded-full blur-2xl group-hover:bg-green/12 transition-colors duration-300 pointer-events-none" />
      
      <div className="p-3 bg-emerald-100 dark:bg-green-light rounded-xl text-green group-hover:rotate-12 group-hover:scale-115 transition-all duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      <p className="text-ink-muted text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ==========================================
// INTERACTIVE TYPEWRITER WHATSAPP SIMULATOR
// ==========================================
function WhatsAppSimulator() {
  const [messages, setMessages] = useState([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const scenarioIndexRef = useRef(0);

  const scenarios = [
    {
      type: 'text',
      userText: "150 auto to station",
      botResponse: "Logged ₹150 for **Auto** under **Transport** category. ✅ Ledger updated.",
    },
    {
      type: 'voice',
      userText: "🎙️ Voice Note (0:04)",
      botResponse: "🎙️ Transcribed audio: *'350 petrol for scooty'*. Logged ₹350 for **Petrol** under **Transport** category. ✅ Ledger updated.",
    },
    {
      type: 'image',
      userText: "Receipt Uploaded",
      botResponse: "📄 Scanned receipt from **Big Bazaar**. Extracted: **₹1,850** for Groceries. Logged under **Groceries** category. ✅ Ledger updated.",
    },
    {
      type: 'text',
      userText: "320 dinner split with flatmates",
      botResponse: "Logged ₹320 for **Dinner**. Split evenly: **₹106.66** each. ✅ Splits updated.",
    }
  ];

  useEffect(() => {
    let timer;
    const runCycle = () => {
      const activeScenario = scenarios[scenarioIndexRef.current];
      setMessages([]);
      setIsBotTyping(false);

      if (activeScenario.type === 'text') {
        let currentLength = 0;
        const typeUserMsg = () => {
          if (currentLength <= activeScenario.userText.length) {
            setMessages([
              {
                sender: 'user',
                type: 'text',
                text: activeScenario.userText.substring(0, currentLength),
                status: 'typing',
                time: 'Just now'
              }
            ]);
            currentLength++;
            timer = setTimeout(typeUserMsg, 80 + Math.random() * 50);
          } else {
            setMessages(prev => [{ ...prev[0], status: 'sent' }]);
            
            timer = setTimeout(() => {
              setMessages(prev => [{ ...prev[0], status: 'read' }]);
              
              timer = setTimeout(() => {
                setIsBotTyping(true);
                
                timer = setTimeout(() => {
                  setIsBotTyping(false);
                  setMessages(prev => [
                    ...prev,
                    {
                      sender: 'bot',
                      type: 'text',
                      text: activeScenario.botResponse,
                      time: 'Just now'
                    }
                  ]);

                  timer = setTimeout(() => {
                    scenarioIndexRef.current = (scenarioIndexRef.current + 1) % scenarios.length;
                    runCycle();
                  }, 4000);
                }, 1200);
              }, 600);
            }, 400);
          }
        };
        typeUserMsg();
      } else if (activeScenario.type === 'voice') {
        // Render sending state immediately for voice note
        setMessages([
          {
            sender: 'user',
            type: 'voice',
            text: 'Voice Note',
            status: 'typing',
            time: 'Just now'
          }
        ]);
        
        timer = setTimeout(() => {
          setMessages(prev => [{ ...prev[0], status: 'sent' }]);
          
          timer = setTimeout(() => {
            setMessages(prev => [{ ...prev[0], status: 'read' }]);
            
            timer = setTimeout(() => {
              setIsBotTyping(true);
              
              timer = setTimeout(() => {
                setIsBotTyping(false);
                setMessages(prev => [
                  ...prev,
                  {
                    sender: 'bot',
                    type: 'text',
                    text: activeScenario.botResponse,
                    time: 'Just now'
                  }
                ]);

                timer = setTimeout(() => {
                  scenarioIndexRef.current = (scenarioIndexRef.current + 1) % scenarios.length;
                  runCycle();
                }, 4000);
              }, 1500); // transcription processing time
            }, 600);
          }, 400);
        }, 1200); // simulate voice recording upload
      } else if (activeScenario.type === 'image') {
        // Render sending state immediately for receipt image
        setMessages([
          {
            sender: 'user',
            type: 'image',
            text: 'Receipt Image',
            status: 'typing',
            time: 'Just now'
          }
        ]);

        timer = setTimeout(() => {
          setMessages(prev => [{ ...prev[0], status: 'sent' }]);
          
          timer = setTimeout(() => {
            setMessages(prev => [{ ...prev[0], status: 'read' }]);
            
            timer = setTimeout(() => {
              setIsBotTyping(true);
              
              timer = setTimeout(() => {
                setIsBotTyping(false);
                setMessages(prev => [
                  ...prev,
                  {
                    sender: 'bot',
                    type: 'text',
                    text: activeScenario.botResponse,
                    time: 'Just now'
                  }
                ]);

                timer = setTimeout(() => {
                  scenarioIndexRef.current = (scenarioIndexRef.current + 1) % scenarios.length;
                  runCycle();
                }, 4000);
              }, 1800); // OCR scan processing time
            }, 600);
          }, 400);
        }, 1400); // simulate file upload network delay
      }
    };

    runCycle();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-sm rounded-[32px] border-[5px] border-border shadow-2xl p-4 bg-white dark:bg-zinc-900/90 relative overflow-hidden">
      {/* Phone notches */}
      <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-28 h-5.5 bg-black rounded-b-xl flex items-center justify-center gap-1 z-20">
        <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
        <span className="w-8 h-1 bg-zinc-800 rounded-full" />
      </div>

      {/* Phone Header bar */}
      <div className="flex items-center justify-between pb-3 pt-4 border-b border-border/50 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-green flex items-center justify-center text-white relative">
            <Wallet className="w-4.5 h-4.5" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green border-2 border-white dark:border-zinc-950 rounded-full" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-ink leading-tight">SampleBook Bot</h4>
            <span className="text-[10px] text-green font-medium flex items-center gap-1">
              online
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-700" />
        </div>
      </div>

      {/* Chat bubbles container */}
      <div className="flex flex-col gap-4 min-h-[320px] justify-end pb-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col gap-1 transition-all duration-300 animate-fade-in ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Conditional bubble rendering based on message type */}
            {msg.sender === 'user' && msg.type === 'voice' ? (
              /* Upgraded Voice Note Bubble */
              <div className="flex items-center gap-3 bg-green text-white px-4 py-3 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                <div className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center cursor-pointer transition">
                  <Play className="w-4.5 h-4.5 text-white fill-white" />
                </div>
                {/* Visual Audio Waveform */}
                <div className="flex items-end gap-0.5 h-6">
                  <span className="w-0.5 h-2 bg-white/60 rounded-full" />
                  <span className="w-0.5 h-4 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-3 bg-white/80 rounded-full" />
                  <span className="w-0.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <span className="w-0.5 h-2 bg-white/60 rounded-full" />
                  <span className="w-0.5 h-4 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                  <span className="w-0.5 h-3 bg-white rounded-full" />
                  <span className="w-0.5 h-5 bg-white rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <span className="w-0.5 h-2 bg-white/60 rounded-full" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-white/85 font-mono">0:04</span>
                </div>
              </div>
            ) : msg.sender === 'user' && msg.type === 'image' ? (
              /* Upgraded Receipt Image Bubble */
              <div className="flex flex-col gap-2 bg-green text-white p-2 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm">
                {/* HTML rendered mini receipt graphic (prevents placeholder loading issues) */}
                <div className="w-48 h-28 rounded-lg relative overflow-hidden bg-white dark:bg-zinc-800 p-2 flex flex-col justify-between text-zinc-800 dark:text-zinc-200 border border-white/20 select-none">
                  <div className="flex justify-between items-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-1">
                    <span className="text-[8px] font-extrabold tracking-wider">BIG BAZAAR</span>
                    <span className="text-[7px] font-mono text-zinc-400">#9831A</span>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 my-2">
                    <div className="flex justify-between text-[7px] text-zinc-500">
                      <span>1x Groceries Pack</span>
                      <span>₹1,200.00</span>
                    </div>
                    <div className="flex justify-between text-[7px] text-zinc-500">
                      <span>2x Dairy Supplies</span>
                      <span>₹650.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-dashed border-zinc-300 dark:border-zinc-700 pt-1">
                    <span className="text-[8px] font-bold">TOTAL AMOUNT</span>
                    <span className="text-[9px] font-extrabold text-green">₹1,850.00</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-white/90 px-1.5 font-medium">
                  <Image className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[150px]">Receipt_BigBazaar.png</span>
                </div>
              </div>
            ) : (
              /* Standard Text Bubble */
              <div
                className={`max-w-[85%] px-4 py-2.5 text-xs shadow-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-green text-white rounded-2xl rounded-tr-none'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-green/20 text-ink rounded-2xl rounded-tl-none'
                }`}
              >
                {msg.sender === 'bot' && (
                  <div className="flex items-center gap-1.5 font-bold text-green mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>SampleBook AI</span>
                  </div>
                )}
                <span>
                  {msg.text.split('**').map((chunk, i) => 
                    i % 2 === 1 ? <strong key={i} className="font-semibold text-green dark:text-emerald-400">{chunk}</strong> : chunk
                  )}
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-[10px] text-ink-muted">
              <span>{msg.time}</span>
              {msg.sender === 'user' && (
                <span className="flex">
                  {msg.status === 'typing' && '...'}
                  {msg.status === 'sent' && <Check className="w-3.5 h-3.5 text-ink-muted" />}
                  {msg.status === 'read' && (
                    <div className="flex -space-x-2">
                      <Check className="w-3.5 h-3.5 text-blue" />
                      <Check className="w-3.5 h-3.5 text-blue" />
                    </div>
                  )}
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Bot Typing bubble indicators */}
        {isBotTyping && (
          <div className="flex flex-col items-start gap-1 transition-all duration-300">
            <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-green/20 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// FAQ ACCORDION COMPONENT
// ==========================================
function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/60 py-4 reveal-on-scroll">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left py-2 text-ink font-semibold group"
      >
        <span className="group-hover:text-green transition-colors duration-200">{question}</span>
        <Plus className={`w-5 h-5 text-green transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 mt-2' : 'max-h-0'}`}>
        <p className="text-ink-muted text-sm leading-relaxed pb-2">{answer}</p>
      </div>
    </div>
  );
}

// ==========================================
// MAIN UPGRADED LANDING PAGE
// ==========================================
export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group, role, loading: groupLoading } = useGroup();
  const [theme, setTheme] = useState(localStorage.getItem('samplebook_theme') || 'light');
  const [showSplash, setShowSplash] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync on-load transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      // Brief delay to trigger entrance animations after loader disappears
      const revealTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 50);
      return () => clearTimeout(revealTimer);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Sync scroll reveals
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply delay attribute if it exists
            const delay = entry.target.getAttribute('data-delay');
            if (delay) {
              setTimeout(() => {
                entry.target.classList.add('revealed');
              }, parseInt(delay));
            } else {
              entry.target.classList.add('revealed');
            }
            observer.unobserve(entry.target); // Unwatch once shown
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    reveals.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('samplebook_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleActionClick = () => {
    if (user) {
      if (!groupLoading) {
        if (group) {
          navigate(role === 'admin' ? '/dashboard' : '/member');
        } else {
          navigate('/onboarding');
        }
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-500 selection:bg-green/20 relative overflow-x-hidden">
      
      {/* ------------------------------------------
         ON-LOAD INTRO SPLASH OVERLAY
         ------------------------------------------ */}
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-paper text-ink transition-opacity duration-700 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-green text-white flex items-center justify-center shadow-lg shadow-green/25 splash-spinner-icon">
            <Wallet className="w-8 h-8" />
          </div>
          <div className="flex flex-col items-center gap-1.5 mt-2">
            <h2 className="text-2xl font-bold tracking-tight text-ink">SampleBook</h2>
            <span className="text-[9px] text-green font-bold tracking-widest uppercase">Initializing Ledger Core...</span>
          </div>
        </div>
      </div>
      
      {/* ------------------------------------------
         LAVA-LAMP GLOW BLOBS
         ------------------------------------------ */}
      <div className="glow-blob bg-green w-[40vw] h-[40vw] -left-[10vw] top-[10vh] max-w-[500px]" style={{ animationDelay: '0s' }} />
      <div className="glow-blob bg-emerald-500 w-[35vw] h-[35vw] right-[5vw] top-[30vh] max-w-[400px]" style={{ animation: 'floatGlow 22s ease-in-out infinite alternate', animationDelay: '-4s' }} />
      <div className="glow-blob bg-teal-500 w-[38vw] h-[38vw] -right-[10vw] bottom-[15vh] max-w-[450px]" style={{ animation: 'floatGlow 20s ease-in-out infinite alternate', animationDelay: '-8s' }} />

      {/* 3D Canvas Physics Background */}
      <ThreeDCanvas />

      {/* ==========================================
         STICKY GLASS NAVBAR
         ========================================== */}
      <header 
        style={{ transitionDelay: '100ms' }}
        className={`fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30 backdrop-blur-md load-reveal ${isLoaded ? 'loaded' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-green flex items-center justify-center text-white shadow-md shadow-green/25 transform hover:scale-105 transition-transform duration-300">
              <Wallet className="w-5.5 h-5.5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-ink">SampleBook</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-ink-muted hover:text-green hover:underline decoration-2 underline-offset-4 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-ink-muted hover:text-green hover:underline decoration-2 underline-offset-4 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-ink-muted hover:text-green hover:underline decoration-2 underline-offset-4 transition-colors">Pricing</a>
            <a href="#faqs" className="text-sm font-medium text-ink-muted hover:text-green hover:underline decoration-2 underline-offset-4 transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border/60 text-ink-muted hover:text-green hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all transform hover:rotate-12"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Action CTA */}
            <button
              onClick={handleActionClick}
              className="px-5 py-2.5 bg-green hover:bg-green-mid text-white rounded-xl font-medium shadow-lg shadow-green/10 hover:shadow-green/25 hover:scale-103 transition-all flex items-center gap-1.5"
            >
              {user ? (
                <>
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowUpRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ==========================================
         HERO SECTION
         ========================================== */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text */}
          <div 
            style={{ transitionDelay: '300ms' }}
            className={`md:col-span-7 flex flex-col items-start gap-6 text-left relative load-reveal ${isLoaded ? 'loaded' : ''}`}
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-green/10 border border-green/20 text-green font-semibold text-xs tracking-wide uppercase animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Ledger Sync</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-ink leading-tight">
              Track Expenses <br />
              as Easily as <br />
              <span className="text-green bg-gradient-to-r from-green to-emerald-500 bg-clip-text text-transparent">Sending a Text</span>
            </h1>

            <p className="text-ink-muted text-base md:text-lg leading-relaxed max-w-xl">
              Keep using the app you love. Simply text transaction details, send voice notes, or upload receipt photos to WhatsApp, and our AI automatically extracts amounts, classifies categories, and updates your ledger in seconds.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleActionClick}
                className="px-8 py-4 bg-green hover:bg-green-mid text-white rounded-xl font-semibold shadow-xl shadow-green/15 hover:shadow-green/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span>Start Free Bookkeeping</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <a
                href="#how-it-works"
                className="px-6 py-4 rounded-xl border border-border/80 text-ink font-semibold hover:bg-emerald-50/20 dark:hover:bg-zinc-800/20 transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4 text-green fill-green" />
                <span>See it in action</span>
              </a>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-6 md:gap-10 pt-8 border-t border-border/50 w-full max-w-lg">
              <div>
                <span className="block text-3xl font-extrabold text-ink">10k+</span>
                <span className="text-xs text-ink-muted">Expenses Logged</span>
              </div>
              <div>
                <span className="block text-3xl font-extrabold text-ink">99.8%</span>
                <span className="text-xs text-ink-muted">AI Parser Accuracy</span>
              </div>
              <div>
                <span className="block text-3xl font-extrabold text-ink">0s</span>
                <span className="text-xs text-ink-muted">App Installs Needed</span>
              </div>
            </div>
          </div>

          {/* Right Column WhatsApp Simulator */}
          <div 
            style={{ transitionDelay: '550ms' }}
            className={`md:col-span-5 flex justify-center relative load-reveal ${isLoaded ? 'loaded' : ''}`}
          >
            {/* Soft backdrop blur glow */}
            <div className="absolute w-80 h-80 bg-green/15 rounded-full blur-3xl -z-10 -top-12 animate-pulse" />
            <WhatsAppSimulator />
          </div>

        </div>
      </section>

      {/* ==========================================
         FEATURES SECTION
         ========================================== */}
      <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-border/30">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
          <span className="text-green text-xs font-bold uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4.5xl font-bold text-ink mt-2">
            Packed with Powerful Integrations
          </h2>
          <p className="text-ink-muted mt-4 text-sm md:text-base leading-relaxed">
            Stop forcing roommates or families to log into complicated platforms. Let them chat or send voice notes, while you view advanced metrics here.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={MessageSquare}
            title="WhatsApp Bot"
            description="Track amounts, details, and categories. Send text messages natively inside the chat client you use daily."
            index={0}
          />
          <FeatureCard
            icon={Brain}
            title="Multimodal AI"
            description="Extracts items from texts, audio voice messages, and scans receipt photos automatically using OCR."
            index={1}
          />
          <FeatureCard
            icon={BarChart3}
            title="Live Visual Metrics"
            description="Generate colorful interactive graphs. Access spending donut charts, category allocations, and budget indicators."
            index={2}
          />
          <FeatureCard
            icon={Users}
            title="Group Settlement"
            description="Split bills natively. Sync sheets for flatmates, couples, families, or small businesses with multi-user book sync."
            index={3}
          />
        </div>
      </section>

      {/* ==========================================
         HOW IT WORKS SECTION
         ========================================== */}
      <section id="how-it-works" className="py-20 md:py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-border/30">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
          <span className="text-green text-xs font-bold uppercase tracking-wider">How it works</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-2">
            Ledger Processing Pipeline
          </h2>
          <p className="text-ink-muted mt-4 text-sm leading-relaxed">
            A background translation pipeline that extracts your inputs into ledger analytics in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10 relative">
          
          <div className="hidden md:block absolute top-1/4 left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-border/80 -z-10" />

          {/* Step 1 */}
          <div className="flex flex-col items-center text-center gap-4 reveal-on-scroll" data-delay="0">
            <div className="w-16 h-16 rounded-2xl bg-green/10 border border-green/20 text-green flex items-center justify-center text-xl font-bold shadow-md shadow-green/5">
              1
            </div>
            <h3 className="text-lg font-bold text-ink">Text, Voice, or Photo</h3>
            <p className="text-ink-muted text-sm leading-relaxed max-w-xs">
              Type details, record a voice note, or take a picture of your invoice bill directly in WhatsApp.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center gap-4 reveal-on-scroll" data-delay="150">
            <div className="w-16 h-16 rounded-2xl bg-green/10 border border-green/20 text-green flex items-center justify-center text-xl font-bold shadow-md shadow-green/5">
              2
            </div>
            <h3 className="text-lg font-bold text-ink">AI Extraction</h3>
            <p className="text-ink-muted text-sm leading-relaxed max-w-xs">
              The AI parses audio transcripts, runs OCR scanning on images, and splits costs among group members.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center gap-4 reveal-on-scroll" data-delay="300">
            <div className="w-16 h-16 rounded-2xl bg-green/10 border border-green/20 text-green flex items-center justify-center text-xl font-bold shadow-md shadow-green/5">
              3
            </div>
            <h3 className="text-lg font-bold text-ink">View Analytics</h3>
            <p className="text-ink-muted text-sm leading-relaxed max-w-xs">
              Open the SampleBook dashboard to check budgets, settlement tabs, category trends, and monthly reports.
            </p>
          </div>

        </div>
      </section>

      {/* ==========================================
         PRICING SECTION
         ========================================== */}
      <section id="pricing" className="py-20 md:py-28 max-w-7xl mx-auto px-6 relative z-10 border-t border-border/30">
        <div className="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
          <span className="text-green text-xs font-bold uppercase tracking-wider">Pricing</span>
          <h2 className="text-3xl md:text-4.5xl font-bold text-ink mt-2">
            Plans Built for Every Scale
          </h2>
          <p className="text-ink-muted mt-4 text-sm leading-relaxed">
            Choose a plan that fits your household budgeting or small business bookkeeping.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          
          {/* Plan 1 — Free */}
          <div className="glass-card p-7 rounded-2xl border border-border flex flex-col justify-between gap-6 relative reveal-on-scroll">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-ink">Starter Free</h3>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-ink-muted text-[9px] font-bold uppercase">Basic</span>
              </div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3.5xl font-extrabold text-ink">₹0</span>
                <span className="text-ink-muted text-xs">/ forever</span>
              </div>
              
              <ul className="flex flex-col gap-3 mb-6">
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                  <span>Personal finance ledger tracking</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>1 active group ledger (max 2 members)</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>50 free parsed messages per month</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Standard AI category classification</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleActionClick}
              className="w-full py-2.5 border border-green hover:bg-emerald-50/20 dark:hover:bg-zinc-800/20 text-green text-sm font-semibold rounded-xl transition-all"
            >
              Get Started Free
            </button>
          </div>

          {/* Plan 2 — Pro */}
          <div className="glass-card p-7 rounded-2xl border-2 border-green flex flex-col justify-between gap-6 relative shadow-lg reveal-on-scroll">
            <div className="absolute -top-3.5 right-6 px-3 py-1 bg-green text-white text-[9px] font-bold uppercase tracking-wider rounded-full shadow-md">
              Most Popular
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-ink">Premium Pro</h3>
                <span className="px-2.5 py-0.5 rounded bg-green/10 text-green text-[9px] font-bold uppercase">Popular</span>
              </div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3.5xl font-extrabold text-ink">₹199</span>
                <span className="text-ink-muted text-xs">/ month</span>
              </div>
              
              <ul className="flex flex-col gap-3 mb-6">
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0 mt-0.5" />
                  <span>1 group ledger (up to 6 members)</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span className="font-semibold text-green dark:text-emerald-400">Unlimited expense entries</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Advanced AI natural language processing</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Real-time settlements and sheets</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleActionClick}
              className="w-full py-2.5 bg-green hover:bg-green-mid text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-green/10"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Plan 3 — Enterprise */}
          <div className="glass-card p-7 rounded-2xl border border-border flex flex-col justify-between gap-6 relative reveal-on-scroll">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-ink">Enterprise</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-zinc-800 text-green text-[9px] font-bold uppercase">Scalable</span>
              </div>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-3.5xl font-extrabold text-ink">₹399</span>
                <span className="text-ink-muted text-xs">/ month</span>
              </div>
              
              <ul className="flex flex-col gap-3 mb-6">
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Collaborative group ledgers (up to 12 members)</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span className="font-semibold text-green dark:text-emerald-400">Unlimited entries, voices & receipt uploads</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Custom split ratios & cost divisions</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Monthly PDF budget statements emailed</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs text-ink-soft">
                  <Check className="w-4 h-4 text-green flex-shrink-0" />
                  <span>Priority support & receipt scanner backup</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleActionClick}
              className="w-full py-2.5 border border-green hover:bg-emerald-50/20 dark:hover:bg-zinc-800/20 text-green text-sm font-semibold rounded-xl transition-all"
            >
              Deploy Enterprise
            </button>
          </div>

        </div>
      </section>

      {/* ==========================================
         FAQS SECTION
         ========================================== */}
      <section id="faqs" className="py-20 md:py-28 max-w-4xl mx-auto px-6 relative z-10 border-t border-border/30">
        <div className="text-center mb-16 reveal-on-scroll">
          <span className="text-green text-xs font-bold uppercase tracking-wider">FAQs</span>
          <h2 className="text-3xl md:text-4xl font-bold text-ink mt-2">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="flex flex-col">
          <FAQItem
            question="Do I need to download any apps to track expenses?"
            answer="No, you don't. The expense tracking happens natively inside WhatsApp via a chatbot. You only open this web dashboard when you want to view charts, split calculations, or group configurations."
          />
          <FAQItem
            question="How precise is the natural language parser?"
            answer="Our AI engine is highly trained on Indian payment terms, emoji inputs, shorthand codes, and currencies. It reaches 99.8% precision in capturing names, amounts, categories, and remarks."
          />
          <FAQItem
            question="Can roomates or couples split expenses?"
            answer="Yes! Once you configure a group, roomates can text the bot directly. Writing 'split' tags updates group metrics, calculating settlements automatically."
          />
          <FAQItem
            question="Is my financial data secure?"
            answer="Yes, all communications are encrypted, and records are stored inside a secure database. We do not have access to your personal messages or payment accounts."
          />
        </div>
      </section>

      {/* ==========================================
         CTA SECTION
         ========================================== */}
      <section className="py-20 md:py-28 bg-green text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-6 relative z-10 reveal-on-scroll">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Ready to Take Control of Your Ledger?
          </h2>
          <p className="text-emerald-100 max-w-xl text-base md:text-lg leading-relaxed">
            Join thousands of users tracking family accounts, flatmate bills, and business ledgers instantly.
          </p>
          <button
            onClick={handleActionClick}
            className="px-8 py-4 bg-white text-green hover:bg-emerald-50 rounded-xl font-bold shadow-2xl hover:scale-103 hover:-translate-y-0.5 transition-all flex items-center gap-2 mt-4"
          >
            <span>Start Bookkeeping Now</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* ==========================================
         FOOTER
         ========================================== */}
      <footer className="py-16 border-t border-border/35 bg-zinc-50/70 dark:bg-zinc-950/70 backdrop-blur-md relative z-10 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col items-start gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green flex items-center justify-center text-white">
                <Wallet className="w-4.5 h-4.5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-ink">SampleBook</span>
            </div>
            <p className="text-ink-muted text-left leading-relaxed max-w-sm text-xs">
              Automating ledgers through WhatsApp chat natively. Simply text transaction entries, and let AI parse categorizations in real time. Har Rupaye Ka Hisaab.
            </p>
            <span className="text-[10px] text-ink-muted mt-2">
              &copy; {new Date().getFullYear()} SampleBook. All rights reserved.
            </span>
          </div>

          {/* Nav Links Col */}
          <div className="md:col-span-2 flex flex-col items-start gap-3">
            <h4 className="font-bold text-xs text-ink uppercase tracking-wider">Product</h4>
            <div className="flex flex-col gap-2.5 text-left text-ink-muted">
              <a href="#features" className="hover:text-green transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-green transition-colors">How it works</a>
              <a href="#pricing" className="hover:text-green transition-colors">Pricing plans</a>
              <a href="#faqs" className="hover:text-green transition-colors">Help FAQs</a>
            </div>
          </div>

          {/* Legal / Support Col */}
          <div className="md:col-span-3 flex flex-col items-start gap-3">
            <h4 className="font-bold text-xs text-ink uppercase tracking-wider">Legal & Support</h4>
            <div className="flex flex-col gap-2.5 text-left text-ink-muted">
              <Link to="/privacy" className="hover:text-green transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-green transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-green transition-colors">Contact Support</Link>
            </div>
          </div>

          {/* Socials Col */}
          <div className="md:col-span-2 flex flex-col items-start gap-3">
            <h4 className="font-bold text-xs text-ink uppercase tracking-wider">Stay Connected</h4>
            <div className="flex flex-col gap-2.5 text-left text-ink-muted">
              <a href="https://wa.me/91811629883" target="_blank" rel="noopener noreferrer" className="hover:text-green transition-colors">WhatsApp Bot</a>
              <a href="#" className="hover:text-green transition-colors">Twitter (X)</a>
              <a href="#" className="hover:text-green transition-colors">GitHub project</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
