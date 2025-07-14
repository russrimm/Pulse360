import React from 'react'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center">
      <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 w-full">
        <div className="flex flex-col items-center mb-6">
          <Image src="/icons/azure/general/10005-icon-service-Information.svg" alt="About" width={48} height={48} className="mb-2" />
          <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-300 mb-1 text-center">Welcome to Pulse 360°</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg">A Vibe Coding Project by a Non-Coder</p>
        </div>
        <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
          <p>Hey there,</p>
          <p>
            For years, I've had ideas for apps and websites—some brilliant, some questionable, all of them just out of reach. Why? Because I never had the attention span (or, let's be honest, the patience) to sit down and actually learn to code. I'd dabble in PowerShell, tinker with batch files, and then get distracted by something shiny (or a snack).
          </p>
          <p>
            Then along came Vibe Coding. Suddenly, building something real didn't mean memorizing syntax or debugging for hours. It meant describing what I wanted, letting an AI do the heavy lifting, and poking it until it worked. The rest, as they say, is history—and this site is the proof.
          </p>
          <h2 className="text-xl font-semibold mt-8 mb-2">How This Site Was Made (No Magic, Just Prompts)</h2>
          <ul>
            <li><b>Stack:</b> Next.js 15 App Router, React, TypeScript, Tailwind, Shadcn UI, Radix UI, Viem, Wagmi, and a parade of SVGs.</li>
            <li><b>Design:</b> Modern, mobile-first, and accessibility-friendly. If it looks weird on your phone, blame the AI (or me).</li>
            <li><b>Development:</b> 100% prompt-driven. I described what I wanted, the AI wrote the code, and I poked it until it worked. No Stack Overflow rabbit holes required.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-8 mb-2">If You Want to Build Something Like This…</h2>
          <p>Here are the kinds of prompts that worked best for each part of the site:</p>
          <ul>
            <li><b>Landing Page & Navbar:</b> <code>"Create a modern Next.js landing page with a sticky navbar, logo, and responsive design. Use Tailwind and Shadcn UI."</code></li>
            <li><b>Product Filters & Cards:</b> <code>"Show a grid of product cards with SVG icons, filterable by product. Make it mobile-friendly and accessible."</code></li>
            <li><b>Azure Updates & News:</b> <code>"Fetch and display Azure updates from an API. Use infinite scroll, search, and filter by product. Style with Tailwind."</code></li>
            <li><b>Detail Views:</b> <code>"Add a detail page for each update with a back arrow, date, and all the tags. Keep the layout clean."</code></li>
            <li><b>SVG Icon Consistency:</b> <code>"Map product names to SVG icons. Use the right icon everywhere, even in filters and cards."</code></li>
            <li><b>Accessibility & Polish:</b> <code>"Make sure all buttons are accessible, keyboard-friendly, and have focus states. Add tooltips and ARIA labels."</code></li>
            <li><b>About Page (this one!):</b> <code>"Write a fun, modern about page styled like a welcome email. Explain the project, the stack, and how prompts drove the build. Make it entertaining but concise."</code></li>
          </ul>
          <h2 className="text-xl font-semibold mt-8 mb-2">Lessons Learned</h2>
          <ul>
            <li>AI is a great coding partner, but it's not psychic. Be specific, be patient, and don't be afraid to say, "No, do it again."</li>
            <li>Modern frameworks are powerful, but you don't need to know everything to get started. Just start.</li>
            <li>Debugging is 80% of the job. The other 20% is asking, "Why is there a horizontal scrollbar?"</li>
            <li>Every bug is a learning opportunity. Or a reason to take a coffee break.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-8 mb-2">Vibe Coding Tips & Tricks</h2>
          <ul>
            <li><b>Be the AI's eyes:</b> Instead of telling the AI exactly how to fix something, describe what you see and what you don't like. For example, say "The button looks off-center on mobile" or "The card titles are getting cut off"—not "Change the margin to 8px." The AI often has a better (or weirder) way to fix it than you'd think.</li>
            <li><b>Iterate fast:</b> Don't stress about getting the perfect prompt. Try something, see what happens, and adjust. The more you describe what you see, the better the results.</li>
            <li><b>Stay curious:</b> If something looks odd, ask the AI why it did it that way. Sometimes you'll learn a new trick—or at least get a laugh.</li>
            <li><b>Feedback is gold:</b> The more you point out what you like and don't like, the more the AI dials in your vibe. Treat it like a creative partner, not a vending machine.</li>
          </ul>
          <h2 className="text-xl font-semibold mt-8 mb-2">Want to Build Something Like This?</h2>
          <p>If you're curious how this site was made, or want to build your own, I'm happy to share everything I learned (and all the mistakes I made). Just reach out to your Microsoft CSAM and ask to schedule a call with me. Let's vibe code together!</p>
          <p className="mt-8">Thanks for visiting! If you have feedback, ideas, or just want to say hi, hit the About icon in the navbar or <a href="mailto:russ.rimmerman@microsoft.com?subject=Pulse 360 Feedback" className="text-primary-600 dark:text-primary-400 underline">email me</a>. Happy Vibe Coding!</p>
        </div>
      </div>
    </main>
  )
} 