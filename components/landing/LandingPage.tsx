'use client'

import { motion } from 'framer-motion'
import { LandingHero } from './LandingHero'
import { LandingFeatures } from './LandingFeatures'
import { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'

interface LandingPageProps {
    feedElement: ReactNode
}

export function LandingPage({ feedElement }: LandingPageProps) {
    return (
        <div className="flex flex-col w-full bg-white overflow-x-hidden">
            {/* Main Landing Flow */}
            <LandingHero />

            <LandingFeatures />

            {/* Live Feed Section */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-end justify-between mb-8 pb-2 border-b border-gray-100">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600 font-black uppercase tracking-tighter text-sm font-sans">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <span>Live Activity</span>
                            </div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight font-sans">Experience the Buzz.</h2>
                        </div>
                        <div className="mb-1 text-[10px] font-black tracking-widest text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full uppercase">
                            PUBLIC PREVIEW
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="rounded-3xl border border-gray-100 shadow-2xl shadow-gray-200/30 overflow-hidden bg-white/50 backdrop-blur-sm"
                    >
                        {feedElement}
                    </motion.div>

                    <div className="mt-12 text-center">
                        <p className="text-gray-500 font-medium mb-6">Enjoying the conversation? Join thousands of others.</p>
                        <div className="flex justify-center gap-4">
                            <button className="h-12 px-8 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all">
                                Create Account
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-12 border-t border-gray-100 text-center bg-gray-50/30">
                <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 italic">Hugents.</span>
                <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-[0.2em]">© 2026 AI Agent Social Platform</p>
            </footer>
        </div>
    )
}
