(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[3185],{35883:function(){},56998:function(e,t,n){Promise.resolve().then(n.t.bind(n,63385,23)),Promise.resolve().then(n.t.bind(n,99646,23)),Promise.resolve().then(n.bind(n,92813)),Promise.resolve().then(n.bind(n,53610)),Promise.resolve().then(n.bind(n,60827)),Promise.resolve().then(n.bind(n,3397)),Promise.resolve().then(n.bind(n,18628)),Promise.resolve().then(n.bind(n,91389))},92813:function(e,t,n){"use strict";n.r(t),n.d(t,{Providers:function(){return g}});var r=n(57437),a=n(14701),s=n(56926),l=n(42826),i=n(75404);let o=(0,n(71186).a)({id:137,name:"Polygon",network:"matic",nativeCurrency:{name:"MATIC",symbol:"MATIC",decimals:18},rpcUrls:{alchemy:{http:["https://polygon-mainnet.g.alchemy.com/v2"],webSocket:["wss://polygon-mainnet.g.alchemy.com/v2"]},infura:{http:["https://polygon-mainnet.infura.io/v3"],webSocket:["wss://polygon-mainnet.infura.io/ws/v3"]},default:{http:["https://polygon-rpc.com"]},public:{http:["https://polygon-rpc.com"]}},blockExplorers:{etherscan:{name:"PolygonScan",url:"https://polygonscan.com"},default:{name:"PolygonScan",url:"https://polygonscan.com"}},contracts:{multicall3:{address:"0xca11bde05977b3631167028862be2a173976ca11",blockCreated:25770160}}}),c=n(62601).env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID||"your-project-id",{chains:u,publicClient:d}=(0,l.QB)([i.R,o],[function(e){return e.rpcUrls.public.http[0]?{chain:e,rpcUrls:e.rpcUrls.public}:null}]),{connectors:m}=(0,a.wo)({appName:"Habit Tracker",projectId:c,chains:u}),h=(0,s._g)({autoConnect:!0,connectors:m,publicClient:d});function g(e){let{children:t}=e;return(0,r.jsx)(s.eM,{config:h,children:(0,r.jsx)(a.pj,{chains:u,children:t})})}n(80867)},53610:function(e,t,n){"use strict";n.r(t),n.d(t,{Sidebar:function(){return h}});var r=n(57437),a=n(18628),s=n(91389),l=n(14958),i=n(91350),o=n(2265);function c(e){let{inSidebar:t=!1}=e,[n,a]=(0,o.useState)(!1),{theme:s,setTheme:l}=(0,i.F)();if((0,o.useEffect)(()=>a(!0),[]),!n)return null;let c=()=>{l("dark"===s?"light":"dark")};return(0,r.jsx)("button",{onClick:e=>{e.stopPropagation(),c()},className:t?"flex items-center justify-center pointer-events-auto":"fixed top-4 right-4 p-3 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110 z-50","aria-label":"Toggle theme",children:"dark"===s?(0,r.jsx)("svg",{className:"w-5 h-5 text-yellow-500",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"})}):(0,r.jsx)("svg",{className:"w-5 h-5 text-gray-900 dark:text-gray-300",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"})})})}var u=n(61396),d=n.n(u),m=n(24033);function h(){let{user:e}=(0,a.useAuth)(),{isCollapsed:t,setIsCollapsed:n}=(0,s.useSidebar)(),i=(0,m.usePathname)();return e?(0,r.jsx)("div",{className:"fixed left-0 top-0 h-full ".concat(t?"w-16":"w-64"," bg-gray-900/40 backdrop-blur-sm shadow-lg transition-all duration-500 z-20 overflow-hidden"),children:(0,r.jsxs)("div",{className:"flex flex-col h-full transition-all duration-500",children:[(0,r.jsx)("div",{className:"px-4 py-4 border-b border-gray-700 ".concat(t?"text-center":""," transition-all duration-500"),children:(0,r.jsxs)("div",{className:"flex items-center ".concat(t?"justify-center":"gap-4"," transition-all duration-500"),children:[!t&&(0,r.jsx)("div",{className:"flex-1 transition-all duration-500",children:(0,r.jsx)("p",{className:"text-sm font-medium text-white truncate transition-all duration-500",children:e.email})}),(0,r.jsx)("button",{onClick:()=>l.O.auth.signOut(),className:"text-sm text-gray-300 hover:text-brand-blue transition-all duration-500",title:"Sign Out",children:t?"\uD83D\uDEAA":"Sign Out"})]})}),(0,r.jsx)("nav",{className:"flex-1 px-4 py-4",children:(0,r.jsxs)("ul",{className:"space-y-2",children:[(0,r.jsx)("li",{children:(0,r.jsxs)(d(),{href:"/",className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ".concat("/"===i?"bg-gray-800/60":""),title:"Home",children:[(0,r.jsx)("span",{className:"text-lg",children:"\uD83C\uDFE0"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Home"})]})}),(0,r.jsx)("li",{children:(0,r.jsxs)(d(),{href:"/dashboard",className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ".concat("/dashboard"===i?"bg-gray-800/60":""),title:"Dashboard",children:[(0,r.jsx)("span",{className:"text-lg",children:"\uD83D\uDCCA"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Dashboard"})]})}),(0,r.jsx)("li",{children:(0,r.jsxs)(d(),{href:"/habits",className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ".concat("/habits"===i?"bg-gray-800/60":""),title:"Habits",children:[(0,r.jsx)("span",{className:"text-lg",children:"✅"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Habits"})]})}),(0,r.jsx)("li",{children:(0,r.jsxs)(d(),{href:"/journal",className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ".concat("/journal"===i?"bg-gray-800/60":""),title:"Journal",children:[(0,r.jsx)("span",{className:"text-lg",children:"\uD83D\uDCDD"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Journal"})]})})]})}),(0,r.jsx)("div",{className:"px-4 py-4 border-t border-gray-700",children:(0,r.jsxs)("div",{className:"flex flex-col gap-2",children:[(0,r.jsxs)("div",{onClick:()=>{var e;return null===(e=document.querySelector('[aria-label="Toggle theme"]'))||void 0===e?void 0:e.click()},className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 cursor-pointer",title:"Theme",children:[(0,r.jsx)(c,{inSidebar:!0}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Theme"})]}),(0,r.jsxs)("button",{onClick:()=>n(!t),className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500",title:t?"Expand Sidebar":"Collapse Sidebar",children:[(0,r.jsx)("span",{className:"text-lg",children:t?"→":"←"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Collapse"})]}),(0,r.jsxs)(d(),{href:"/settings",className:"flex items-center gap-3 p-2 text-gray-300 hover:bg-gray-800/60 rounded-lg transition-all duration-500 ".concat("/settings"===i?"bg-gray-800/60":""),title:"Settings",children:[(0,r.jsx)("span",{className:"text-lg",children:"⚙️"}),!t&&(0,r.jsx)("span",{className:"transition-all duration-500",children:"Settings"})]})]})})]})}):null}},60827:function(e,t,n){"use strict";n.r(t),n.d(t,{SidebarContent:function(){return l}});var r=n(57437),a=n(91389),s=n(18628);function l(e){let{children:t}=e,{isCollapsed:n}=(0,a.useSidebar)(),{user:l}=(0,s.useAuth)();return(0,r.jsx)("main",{className:"transition-all duration-500 ".concat(l?"".concat(n?"":"delay-[100ms]"," ").concat(n?"ml-16":"ml-64"):""),children:t})}},3397:function(e,t,n){"use strict";n.r(t),n.d(t,{ThemeProvider:function(){return s}});var r=n(57437),a=n(91350);function s(e){let{children:t}=e;return(0,r.jsx)(a.f,{attribute:"class",defaultTheme:"dark",enableSystem:!1,children:t})}},18628:function(e,t,n){"use strict";n.r(t),n.d(t,{AuthProvider:function(){return i},useAuth:function(){return o}});var r=n(57437),a=n(2265),s=n(14958);let l=(0,a.createContext)({user:null,loading:!0,signOut:async()=>{}});function i(e){let{children:t}=e,[n,i]=(0,a.useState)(null),[o,c]=(0,a.useState)(!0),u=async()=>{let{error:e}=await s.O.auth.signOut();if(e)throw console.error("Error signing out:",e),e};return(0,a.useEffect)(()=>{s.O.auth.getSession().then(e=>{var t;let{data:{session:n}}=e;i(null!==(t=null==n?void 0:n.user)&&void 0!==t?t:null),c(!1)});let{data:{subscription:e}}=s.O.auth.onAuthStateChange((e,t)=>{var n;i(null!==(n=null==t?void 0:t.user)&&void 0!==n?n:null),c(!1)});return()=>e.unsubscribe()},[]),(0,r.jsx)(l.Provider,{value:{user:n,loading:o,signOut:u},children:t})}let o=()=>(0,a.useContext)(l)},91389:function(e,t,n){"use strict";n.r(t),n.d(t,{SidebarProvider:function(){return l},useSidebar:function(){return i}});var r=n(57437),a=n(2265);let s=(0,a.createContext)(void 0);function l(e){let{children:t}=e,[n,l]=(0,a.useState)(!1);return(0,r.jsx)(s.Provider,{value:{isCollapsed:n,setIsCollapsed:l},children:t})}function i(){let e=(0,a.useContext)(s);if(void 0===e)throw Error("useSidebar must be used within a SidebarProvider");return e}},14958:function(e,t,n){"use strict";n.d(t,{O:function(){return i}});var r=n(54566);let a="https://dkvaspqbakjcwaxivtqo.supabase.co",s="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdmFzcHFiYWtqY3dheGl2dHFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxMjk4NzcsImV4cCI6MjA1MjcwNTg3N30.dcVtOCJWN17M9K5MFMk6cRNugze9Dw-JnlTniPrFONI\n";if(!a||!s)throw Error("Missing Supabase environment variables");let l=a.trim(),i=(0,r.eI)(l,s,{auth:{persistSession:!0,autoRefreshToken:!0},db:{schema:"public"}})},80867:function(){},63385:function(){},99646:function(e){e.exports={style:{fontFamily:"'__Inter_17b86c', '__Inter_Fallback_17b86c'",fontStyle:"normal"},className:"__className_17b86c"}},24033:function(e,t,n){e.exports=n(15313)},91350:function(e,t,n){"use strict";n.d(t,{F:function(){return u},f:function(){return d}});var r=n(2265),a=(e,t,n,r,a,s,l,i)=>{let o=document.documentElement,c=["light","dark"];function u(t){(Array.isArray(e)?e:[e]).forEach(e=>{let n="class"===e,r=n&&s?a.map(e=>s[e]||e):a;n?(o.classList.remove(...r),o.classList.add(t)):o.setAttribute(e,t)}),i&&c.includes(t)&&(o.style.colorScheme=t)}if(r)u(r);else try{let e=localStorage.getItem(t)||n,r=l&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;u(r)}catch(e){}},s=["light","dark"],l="(prefers-color-scheme: dark)",i="undefined"==typeof window,o=r.createContext(void 0),c={setTheme:e=>{},themes:[]},u=()=>{var e;return null!=(e=r.useContext(o))?e:c},d=e=>r.useContext(o)?r.createElement(r.Fragment,null,e.children):r.createElement(h,{...e}),m=["light","dark"],h=({forcedTheme:e,disableTransitionOnChange:t=!1,enableSystem:n=!0,enableColorScheme:a=!0,storageKey:i="theme",themes:c=m,defaultTheme:u=n?"system":"light",attribute:d="data-theme",value:h,children:x,nonce:v,scriptProps:y})=>{let[j,N]=r.useState(()=>p(i,u)),[w,k]=r.useState(()=>p(i)),S=h?Object.values(h):c,C=r.useCallback(e=>{let r=e;if(!r)return;"system"===e&&n&&(r=b());let l=h?h[r]:r,i=t?f(v):null,o=document.documentElement,c=e=>{"class"===e?(o.classList.remove(...S),l&&o.classList.add(l)):e.startsWith("data-")&&(l?o.setAttribute(e,l):o.removeAttribute(e))};if(Array.isArray(d)?d.forEach(c):c(d),a){let e=s.includes(u)?u:null,t=s.includes(r)?r:e;o.style.colorScheme=t}null==i||i()},[v]),E=r.useCallback(e=>{let t="function"==typeof e?e(j):e;N(t);try{localStorage.setItem(i,t)}catch(e){}},[j]),T=r.useCallback(t=>{k(b(t)),"system"===j&&n&&!e&&C("system")},[j,e]);r.useEffect(()=>{let e=window.matchMedia(l);return e.addListener(T),T(e),()=>e.removeListener(T)},[T]),r.useEffect(()=>{let e=e=>{e.key===i&&(e.newValue?N(e.newValue):E(u))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[E]),r.useEffect(()=>{C(null!=e?e:j)},[e,j]);let I=r.useMemo(()=>({theme:j,setTheme:E,forcedTheme:e,resolvedTheme:"system"===j?w:j,themes:n?[...c,"system"]:c,systemTheme:n?w:void 0}),[j,E,e,w,n,c]);return r.createElement(o.Provider,{value:I},r.createElement(g,{forcedTheme:e,storageKey:i,attribute:d,enableSystem:n,enableColorScheme:a,defaultTheme:u,value:h,themes:c,nonce:v,scriptProps:y}),x)},g=r.memo(({forcedTheme:e,storageKey:t,attribute:n,enableSystem:s,enableColorScheme:l,defaultTheme:i,value:o,themes:c,nonce:u,scriptProps:d})=>{let m=JSON.stringify([n,t,i,e,c,o,s,l]).slice(1,-1);return r.createElement("script",{...d,suppressHydrationWarning:!0,nonce:"undefined"==typeof window?u:"",dangerouslySetInnerHTML:{__html:`(${a.toString()})(${m})`}})}),p=(e,t)=>{let n;if(!i){try{n=localStorage.getItem(e)||void 0}catch(e){}return n||t}},f=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},b=e=>(e||(e=window.matchMedia(l)),e.matches?"dark":"light")}},function(e){e.O(0,[9472,382,6926,980,4951,2971,4938,1744],function(){return e(e.s=56998)}),_N_E=e.O()}]);