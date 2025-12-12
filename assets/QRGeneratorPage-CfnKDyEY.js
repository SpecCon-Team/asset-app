import{j as e}from"./vendor-charts-DVp8BQgJ.js";import{u as Q,r}from"./vendor-react-CFQdvhEG.js";import{a as p}from"./index-CezS3iyn.js";import{showError as i,showSuccess as u}from"./sweetalert-DcBwdyhg.js";import{$ as R,Q as l,P as c,y as A,D as S}from"./vendor-ui-Bhgb65c8.js";function _(){const b=Q(),[x,m]=r.useState(!1),[y,j]=r.useState([]),[d,g]=r.useState(""),[s,h]=r.useState(null);r.useEffect(()=>{f()},[]);const f=async()=>{try{const a=await p().get("/assets"),n=Array.isArray(a.data)?a.data:a.data.assets||[];j(n)}catch(t){console.error("Failed to fetch assets:",t),await i("Error","Failed to load assets")}},w=async t=>{var a,n;if(t.preventDefault(),!d){await i("Error","Please select an asset");return}try{m(!0);const C=await p().post("/checkout/qr/generate",{assetId:d});h(C.data.qrCode),await u("Success!","QR code generated successfully",1500)}catch(o){console.error("Failed to generate QR code:",o),await i("Error",((n=(a=o.response)==null?void 0:a.data)==null?void 0:n.message)||"Failed to generate QR code")}finally{m(!1)}},k=()=>{if(!s)return;const t=document.createElement("a");t.href=s.qrCodeUrl,t.download=`QR_${s.asset.asset_code}.png`,document.body.appendChild(t),t.click(),document.body.removeChild(t),u("Downloaded!","QR code image downloaded",1500)},N=()=>{if(!s)return;const t=window.open("","_blank");t&&(t.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${s.asset.asset_code}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .qr-container {
                text-align: center;
                page-break-inside: avoid;
              }
              img {
                max-width: 300px;
                height: auto;
                border: 2px solid #000;
                padding: 10px;
                background: white;
              }
              h2 {
                margin: 20px 0 10px;
                font-size: 24px;
              }
              p {
                margin: 5px 0;
                font-size: 16px;
                color: #666;
              }
              .code {
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 18px;
                margin-top: 10px;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${s.qrCodeUrl}" alt="QR Code" />
              <h2>${s.asset.name}</h2>
              <p class="code">${s.asset.asset_code}</p>
              <p>Scan to view asset details or checkout</p>
            </div>
          </body>
        </html>
      `),t.document.close(),t.focus(),setTimeout(()=>{t.print(),t.close()},250))},v=()=>{g(""),h(null)};return e.jsx("div",{className:"min-h-screen bg-gray-50 dark:bg-gray-900",children:e.jsxs("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8",children:[e.jsxs("div",{className:"mb-6 md:mb-8",children:[e.jsxs("button",{onClick:()=>b("/checkout"),className:"flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4 transition-colors",children:[e.jsx(R,{className:"w-5 h-5"}),"Back to Checkouts"]}),e.jsxs("div",{className:"text-center md:text-left",children:[e.jsxs("h1",{className:"text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center md:justify-start gap-3",children:[e.jsx(l,{className:"w-7 h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400"}),"QR Code Generator"]}),e.jsx("p",{className:"text-gray-600 dark:text-gray-300 mt-2 text-sm md:text-base",children:"Generate QR codes for quick asset scanning and checkout"})]})]}),e.jsxs("div",{className:"max-w-6xl mx-auto w-full",children:[e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6",children:[e.jsxs("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6",children:[e.jsxs("h2",{className:"text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2",children:[e.jsx(c,{className:"w-5 h-5 text-purple-600 dark:text-purple-400"}),"Select Asset"]}),e.jsxs("form",{onSubmit:w,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2",children:["Asset ",e.jsx("span",{className:"text-red-500",children:"*"})]}),e.jsxs("select",{value:d,onChange:t=>g(t.target.value),required:!0,className:"w-full px-3 md:px-4 py-2 md:py-2.5 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-sm md:text-base",children:[e.jsx("option",{value:"",children:"Select an asset"}),y.map(t=>e.jsxs("option",{value:t.id,children:[t.name," (",t.asset_code,") - ",t.asset_type]},t.id))]})]}),e.jsx("button",{type:"submit",disabled:x||!d,className:"w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2",children:x?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"}),"Generating..."]}):e.jsxs(e.Fragment,{children:[e.jsx(l,{className:"w-5 h-5"}),"Generate QR Code"]})})]}),e.jsxs("div",{className:"mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg",children:[e.jsx("h3",{className:"text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2",children:"How QR Codes Work"}),e.jsxs("ul",{className:"space-y-1 text-xs text-blue-800 dark:text-blue-300",children:[e.jsx("li",{children:"• Each asset gets a unique QR code"}),e.jsx("li",{children:"• QR codes contain asset identification data"}),e.jsx("li",{children:"• Scan to quickly view asset details"}),e.jsx("li",{children:"• Use for fast checkout operations"}),e.jsx("li",{children:"• Print and attach to physical assets"})]})]})]}),e.jsx("div",{className:"bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6",children:s?e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-4",children:[e.jsx(A,{className:"w-6 h-6 text-green-600 dark:text-green-400"}),e.jsx("h2",{className:"text-xl font-semibold text-gray-900 dark:text-white",children:"QR Code Generated!"})]}),e.jsx("div",{className:"flex justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg",children:e.jsx("img",{src:s.qrCodeUrl,alt:"QR Code",className:"w-64 h-64 border-4 border-white dark:border-gray-700 rounded-lg shadow-lg"})}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Asset Name"}),e.jsx("p",{className:"text-lg font-semibold text-gray-900 dark:text-white",children:s.asset.name})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Asset Code"}),e.jsx("p",{className:"text-gray-900 dark:text-white font-mono",children:s.asset.asset_code})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"QR Code Data"}),e.jsx("p",{className:"text-xs text-gray-900 dark:text-white font-mono break-all bg-gray-100 dark:bg-gray-900 p-2 rounded",children:s.qrCode})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Generated"}),e.jsx("p",{className:"text-gray-900 dark:text-white",children:new Date(s.generatedAt).toLocaleString()})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm text-gray-600 dark:text-gray-400",children:"Total Scans"}),e.jsx("p",{className:"text-gray-900 dark:text-white",children:s.scanCount})]})]}),e.jsxs("div",{className:"space-y-3 pt-4 border-t dark:border-gray-700",children:[e.jsxs("button",{onClick:k,className:"w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(S,{className:"w-5 h-5"}),"Download QR Code"]}),e.jsxs("button",{onClick:N,className:"w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2",children:[e.jsx(c,{className:"w-5 h-5"}),"Print QR Code"]}),e.jsx("button",{onClick:v,className:"w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",children:"Generate Another"})]})]}):e.jsxs("div",{className:"flex flex-col items-center justify-center h-full py-12 text-center",children:[e.jsx(l,{className:"w-24 h-24 text-gray-400 mb-4"}),e.jsx("p",{className:"text-gray-600 dark:text-gray-400 mb-2",children:"No QR code generated yet"}),e.jsx("p",{className:"text-sm text-gray-500 dark:text-gray-500",children:'Select an asset and click "Generate QR Code" to create'})]})})]}),e.jsxs("div",{className:"mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 md:p-6",children:[e.jsxs("h3",{className:"text-base md:text-lg font-semibold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2",children:[e.jsx(l,{className:"w-5 h-5"}),"Test QR Code Scanner"]}),e.jsx("p",{className:"text-sm text-blue-800 dark:text-blue-300 mb-3",children:"Want to see how QR codes automatically open the web app? Try our test page!"}),e.jsxs("a",{href:"/qr-test.html",target:"_blank",rel:"noopener noreferrer",className:"inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium",children:[e.jsx(l,{className:"w-4 h-4"}),"Open Test Page"]})]}),e.jsxs("div",{className:"mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 md:p-6",children:[e.jsxs("h3",{className:"text-base md:text-lg font-semibold text-yellow-900 dark:text-yellow-400 mb-2 flex items-center gap-2",children:[e.jsx(c,{className:"w-5 h-5"}),"Bulk QR Code Generation"]}),e.jsx("p",{className:"text-sm text-yellow-800 dark:text-yellow-300",children:"Need to generate QR codes for multiple assets at once? Contact your administrator to enable bulk generation or use the API endpoint for batch operations."})]})]})]})})}export{_ as default};
