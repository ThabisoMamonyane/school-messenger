import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';

const LANDING_PAGE_HTML = `
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
    <style>
        body { 
            font-feature-settings: "cv11", "ss01"; 
            margin: 0; 
            padding: 0; 
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .clip-diagonal { clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%); }
        .luxury-gradient { background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%); }
        .glass-panel {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .text-shadow-sm { text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .reveal-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }
        .stagger-delay-1 { transition-delay: 100ms; }
        .stagger-delay-2 { transition-delay: 200ms; }
        .stagger-delay-3 { transition-delay: 300ms; }
        .stagger-delay-4 { transition-delay: 400ms; }
        .typewriter-cursor::after {
            content: '|';
            animation: blink 1s step-start infinite;
        }
        @keyframes blink { 50% { opacity: 0; } }
        
        /* Custom Font Assignments */
        .font-serif { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="font-sans text-slate-600 bg-white antialiased overflow-x-hidden selection:bg-gold-400 selection:text-white">

    <!-- Scroll Progress Bar -->
    <div class="fixed top-0 left-0 h-1 bg-gradient-to-r from-navy-800 to-gold-400 z-50 w-0 transition-all duration-100" id="progressBar"></div>

    <!-- Navigation -->
    <nav class="fixed w-full z-40 transition-all duration-300 top-0" id="navbar">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="flex justify-between items-center h-20">
                <div class="flex items-center gap-2 group cursor-pointer" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <div class="w-8 h-8 bg-navy-800 text-white flex items-center justify-center rounded-sm font-serif text-lg font-bold group-hover:bg-gold-400 transition-colors duration-500">S</div>
                    <span class="font-serif text-xl font-semibold tracking-tight text-navy-800">School Messenger</span>
                </div>
                <div class="hidden md:flex items-center gap-8">
                    <a href="#features" class="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors">Platform</a>
                    <a href="#architecture" class="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors">Architecture</a>
                    <a href="#pricing" class="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors">Tiers</a>
                    <a href="#roadmap" class="text-sm font-medium text-slate-600 hover:text-navy-800 transition-colors">Roadmap</a>
                    <a href="https://school-messenger-web.vercel.app" class="bg-navy-800 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-navy-900 transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2 group no-underline">
                        <span>Login</span>
                        <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-0.5 transition-transform"></i>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden luxury-gradient">
        <div class="absolute top-0 right-0 w-1/3 h-full bg-slate-50 opacity-50 skew-x-12 translate-x-20 pointer-events-none"></div>
        
        <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
            <div class="grid lg:grid-cols-2 gap-16 items-center">
                <div class="space-y-8 max-w-2xl reveal-on-scroll">
                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-navy-800 mb-2">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-gold-400"></span>
                        </span>
                        Version 1.0 Live
                    </div>
                    <h1 class="font-serif text-5xl lg:text-7xl font-medium tracking-tight text-navy-800 leading-[1.1]">
                        Bridge the gap between <span class="italic text-slate-400">schools, parents,</span> and staff.
                    </h1>
                    <p class="text-lg lg:text-xl text-slate-500 leading-relaxed max-w-lg min-h-[3.5rem]" id="heroTypewriter">
                    </p>
                    <div class="flex flex-col sm:flex-row gap-4 pt-4">
                        <button onclick="parent.appNavigate('SignUp')" class="bg-navy-800 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-navy-900 transition-all hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 group relative overflow-hidden">
                            <span class="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></span>
                            <span>Get Started</span>
                            <i data-lucide="chevron-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
                        </button>
                        <button class="bg-white border border-slate-200 text-navy-800 px-8 py-4 rounded-full text-base font-medium hover:bg-slate-50 transition-all hover:border-slate-300 flex items-center justify-center gap-2">
                            <i data-lucide="file-text" class="w-4 h-4"></i>
                            <span>View Docs</span>
                        </button>
                    </div>
                    <div class="pt-8 flex items-center gap-4 text-sm text-slate-400">
                        <div class="flex items-center gap-1">
                            <i data-lucide="shield-check" class="w-4 h-4 text-green-600"></i>
                            <span class="text-navy-900 font-medium">Supabase Auth</span>
                        </div>
                        <div class="w-1 h-1 rounded-full bg-slate-300"></div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="smartphone" class="w-4 h-4 text-navy-800"></i>
                            <span class="text-navy-900 font-medium">React Native</span>
                        </div>
                    </div>
                </div>

                <div class="relative h-[500px] w-full reveal-on-scroll stagger-delay-2 group">
                     <div class="absolute top-10 left-0 w-full max-w-md bg-white rounded-xl shadow-lg border border-red-100 p-6 transform -rotate-6 scale-90 opacity-60 transition-all duration-700 group-hover:opacity-0 group-hover:translate-x-[-100px]">
                        <div class="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                            <div class="w-3 h-3 rounded-full bg-red-400"></div>
                            <span class="text-xs font-semibold text-red-500">Authentication Failed</span>
                        </div>
                        <div class="space-y-3 opacity-50">
                            <div class="h-2 bg-slate-200 rounded w-3/4"></div>
                            <div class="h-2 bg-slate-200 rounded w-1/2"></div>
                            <div class="h-2 bg-slate-200 rounded w-5/6"></div>
                        </div>
                    </div>

                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-0 overflow-hidden transform transition-all duration-700 hover:scale-105 z-20">
                        <div class="bg-navy-800 p-4 flex justify-between items-center">
                            <div class="flex gap-2">
                                <div class="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                <div class="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                            </div>
                            <span class="text-xs font-medium text-white/80">Dashboard</span>
                        </div>
                        <div class="p-6">
                            <div class="flex items-center justify-between mb-6">
                                <h3 class="font-serif text-lg font-medium text-navy-800">School Updates</h3>
                                <span class="px-2 py-1 bg-green-50 text-green-600 text-xs rounded-full border border-green-100 flex items-center gap-1">
                                    <i data-lucide="radio" class="w-3 h-3"></i> Broadcast
                                </span>
                            </div>
                            <div class="space-y-3">
                                <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                                        <i data-lucide="newspaper" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <span class="text-xs font-bold text-blue-600 uppercase tracking-wide">News</span>
                                        <p class="text-sm font-medium text-slate-700">Science Fair Winners</p>
                                    </div>
                                </div>
                                <div class="p-3 bg-orange-50/50 rounded-lg border border-orange-100 flex items-start gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                                        <i data-lucide="trophy" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <span class="text-xs font-bold text-orange-600 uppercase tracking-wide">Sport</span>
                                        <p class="text-sm font-medium text-slate-700">Varsity Finals Updates</p>
                                    </div>
                                </div>
                                <div class="p-3 bg-purple-50/50 rounded-lg border border-purple-100 flex items-start gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0">
                                        <i data-lucide="book-open" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <span class="text-xs font-bold text-purple-600 uppercase tracking-wide">Academic</span>
                                        <p class="text-sm font-medium text-slate-700">Exam Schedule Released</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="absolute top-1/2 left-1/2 w-[120%] h-[120%] -translate-x-1/2 -translate-y-1/2 border border-slate-200/50 rounded-full animate-[spin_20s_linear_infinite] pointer-events-none -z-10"></div>
                    <div class="absolute top-20 left-10 p-2 bg-white shadow-lg rounded-xl animate-float"><i data-lucide="bell" class="w-5 h-5 text-brand-orange"></i></div>
                    <div class="absolute bottom-20 right-10 p-2 bg-white shadow-lg rounded-xl animate-float-delayed"><i data-lucide="shield" class="w-5 h-5 text-brand-green"></i></div>
                </div>
            </div>
        </div>
    </section>

    <!-- Categories / Features -->
    <section class="py-24 bg-white" id="features">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="text-center max-w-2xl mx-auto mb-16 reveal-on-scroll">
                <h2 class="font-serif text-3xl lg:text-4xl font-medium text-navy-800 mb-4 tracking-tight">Structured Communication</h2>
                <p class="text-slate-500 text-lg">Organize school life into clear, manageable channels.</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="newspaper" class="w-5 h-5 text-blue-600"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">News</span>
                </div>
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll stagger-delay-1">
                    <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="book" class="w-5 h-5 text-purple-600"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">Academic</span>
                </div>
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll stagger-delay-2">
                    <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="trophy" class="w-5 h-5 text-orange-600"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">Sport</span>
                </div>
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll stagger-delay-3">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="file-text" class="w-5 h-5 text-green-600"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">Letters</span>
                </div>
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll stagger-delay-4">
                    <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="pencil" class="w-5 h-5 text-red-600"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">Homework</span>
                </div>
                <div class="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow group reveal-on-scroll">
                    <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <i data-lucide="megaphone" class="w-5 h-5 text-gray-700"></i>
                    </div>
                    <span class="font-medium text-sm text-navy-800">General</span>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-slate-50 overflow-hidden" id="architecture">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="grid lg:grid-cols-2 gap-16 items-center">
                <div class="reveal-on-scroll">
                    <div class="inline-block bg-navy-800 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">TECHNICAL ARCHITECTURE</div>
                    <h2 class="font-serif text-3xl lg:text-4xl font-medium text-navy-800 mb-6">Secure, Role-Based Access Control</h2>
                    <p class="text-slate-500 text-lg mb-8">Built on Supabase and React Native for enterprise-grade security and performance.</p>
                    
                    <div class="space-y-6">
                        <div class="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:shadow-md">
                            <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="shield" class="w-5 h-5 text-blue-600"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-navy-800">School Admin</h4>
                                <p class="text-sm text-slate-500 mt-1">Manage profile, staff, and global announcements.</p>
                            </div>
                        </div>

                        <div class="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:shadow-md">
                            <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="users" class="w-5 h-5 text-indigo-600"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-navy-800">Teachers &amp; Comms Officers</h4>
                                <p class="text-sm text-slate-500 mt-1">Create groups, post homework, and send category updates.</p>
                            </div>
                        </div>

                        <div class="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200 transition-all hover:border-blue-200 hover:shadow-md">
                            <div class="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <i data-lucide="eye" class="w-5 h-5 text-green-600"></i>
                            </div>
                            <div>
                                <h4 class="font-medium text-navy-800">Parents (View Only)</h4>
                                <p class="text-sm text-slate-500 mt-1">Real-time access, join multiple schools, push notifications.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="relative reveal-on-scroll stagger-delay-2">
                    <div class="bg-navy-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-white">
                        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
                        <h3 class="font-serif text-xl mb-6 relative z-10">System Architecture</h3>
                        <div class="space-y-4 relative z-10">
                            <div class="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/50">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="database" class="text-green-400"></i>
                                    <span class="font-mono text-sm">Supabase (PostgreSQL)</span>
                                </div>
                                <span class="text-xs text-slate-400">Backend</span>
                            </div>
                            <div class="flex justify-center h-4">
                                <div class="w-px h-full bg-slate-700"></div>
                            </div>
                            <div class="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/50">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="lock" class="text-yellow-400"></i>
                                    <span class="font-mono text-sm">Row Level Security</span>
                                </div>
                                <span class="text-xs text-slate-400">Auth</span>
                            </div>
                            <div class="flex justify-center h-4">
                                <div class="w-px h-full bg-slate-700"></div>
                            </div>
                            <div class="flex items-center justify-between p-3 border border-slate-700 rounded-lg bg-slate-800/50">
                                <div class="flex items-center gap-3">
                                    <i data-lucide="smartphone" class="text-blue-400"></i>
                                    <span class="font-mono text-sm">React Native / Expo</span>
                                </div>
                                <span class="text-xs text-slate-400">Frontend</span>
                            </div>
                        </div>
                        <div class="mt-8 pt-6 border-t border-slate-700 grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Push Service</p>
                                <p class="font-semibold text-white">Expo Notifications</p>
                            </div>
                            <div>
                                <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Encryption</p>
                                <p class="font-semibold text-white">HTTPS / JWT</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 bg-white" id="pricing">
        <div class="max-w-7xl mx-auto px-6 lg:px-8">
            <div class="text-center mb-16 reveal-on-scroll">
                <h2 class="font-serif text-3xl font-medium text-navy-800 mb-4">Simple Tiered Pricing</h2>
                <p class="text-slate-500">Choose the right plan for your institution.</p>
            </div>
            <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 reveal-on-scroll">
                    <h3 class="font-serif text-2xl text-navy-800 mb-2">Free Tier</h3>
                    <p class="text-slate-500 text-sm mb-6">Essential communication for small groups.</p>
                    <div class="text-4xl font-bold text-navy-800 mb-8">$0<span class="text-lg font-normal text-slate-400">/mo</span></div>
                    <ul class="space-y-4 mb-8">
                        <li class="flex items-center gap-3 text-sm">
                            <i data-lucide="check" class="w-4 h-4 text-green-600"></i>
                            <span>Basic Messaging</span>
                        </li>
                        <li class="flex items-center gap-3 text-sm">
                            <i data-lucide="check" class="w-4 h-4 text-green-600"></i>
                            <span>Up to 3 Staff Members</span>
                        </li>
                        <li class="flex items-center gap-3 text-sm">
                            <i data-lucide="check" class="w-4 h-4 text-green-600"></i>
                            <span>Up to 5 Groups</span>
                        </li>
                    </ul>
                    <button class="w-full border border-navy-800 text-navy-800 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                        Start Free
                    </button>
                </div>

                <div class="bg-navy-900 p-8 rounded-2xl shadow-xl border border-navy-800 relative overflow-hidden reveal-on-scroll stagger-delay-1">
                    <div class="absolute top-0 right-0 bg-gold-400 text-navy-900 text-xs font-bold px-3 py-1 rounded-bl-lg">RECOMMENDED</div>
                    <h3 class="font-serif text-2xl text-white mb-2">Paid Tier</h3>
                    <p class="text-slate-300 text-sm mb-6">Full power for entire schools.</p>
                    <div class="text-4xl font-bold text-white mb-8">$3,500<span class="text-lg font-normal text-slate-400">/yr</span></div>
                    <ul class="space-y-4 mb-8 text-white">
                        <li class="flex items-center gap-3 text-sm">
                            <div class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                <i data-lucide="check" class="w-2.5 h-2.5 text-white"></i>
                            </div>
                            <span>Everything in Free</span>
                        </li>
                        <li class="flex items-center gap-3 text-sm">
                            <div class="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                <i data-lucide="check" class="w-2.5 h-2.5 text-white"></i>
                            </div>
                            <span>Unlimited Staff Members</span>
                        </li>
                    </ul>
                    <button onclick="parent.appNavigate('SignUp')" class="w-full bg-gold-400 text-navy-900 py-3 rounded-lg font-medium hover:bg-gold-500 transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    </section>

    <footer class="bg-white border-t border-slate-100 py-12">
        <div class="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-navy-800 text-white flex items-center justify-center rounded-sm font-serif text-sm">S</div>
                <span class="font-serif text-lg font-semibold text-navy-800">School Messenger</span>
            </div>
            <div class="text-sm text-slate-500">
                © 2025 School Messenger. Version 1.0.
            </div>
            <div class="flex gap-6">
                <a href="#" class="text-slate-400 hover:text-navy-800 text-sm">Documentation</a>
                <a href="#" class="text-slate-400 hover:text-navy-800 text-sm">Privacy Policy</a>
                <a href="#" class="text-slate-400 hover:text-navy-800 text-sm">Support</a>
            </div>
        </div>
    </footer>

    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: { 800: '#1a2332', 900: '#0f1621' },
                        gold: { 400: '#d4af37', 500: '#c5a028' },
                        brand: { blue: '#2563eb', green: '#15803d', orange: '#ea580c', red: '#ef4444' }
                    },
                    fontFamily: { sans: ['Inter', 'sans-serif'], serif: ['Playfair Display', 'serif'] },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'float-delayed': 'float 6s ease-in-out 3s infinite',
                        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        'scroll': 'scroll 30s linear infinite',
                        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                        'shimmer': 'shimmer 2.5s infinite',
                    },
                    keyframes: {
                        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
                        scroll: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
                        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
                        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
                    }
                }
            }
        };

        const init = () => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
                setupObserver();
                setupHeader();
                startTypewriter();
            } else {
                setTimeout(init, 100);
            }
        };

        const setupObserver = () => {
            const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('is-visible');
                });
            }, observerOptions);
            document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        };

        const setupHeader = () => {
            window.addEventListener('scroll', () => {
                const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = (winScroll / height) * 100;
                const progress = document.getElementById("progressBar");
                if (progress) progress.style.width = scrolled + "%";
                
                const nav = document.getElementById('navbar');
                if (nav) {
                    if (winScroll > 50) nav.classList.add('glass-panel', 'shadow-sm');
                    else nav.classList.remove('glass-panel', 'shadow-sm');
                }
            });
        };

        const startTypewriter = () => {
            const heroText = "Centralize announcements, manage staff groups, and provide real-time updates to parents securely.";
            const typeWriterElement = document.getElementById('heroTypewriter');
            if (!typeWriterElement) return;
            let i = 0;
            const typeWriter = () => {
                if (i < heroText.length) {
                    typeWriterElement.innerHTML += heroText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 30);
                }
            };
            setTimeout(typeWriter, 800);
        };

        init();
    </script>
</body>
</html>
`;

export default function LandingPageWeb({ navigation }) {
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Navigation bridge for iframe
        window.appNavigate = (screen) => {
            navigation.navigate(screen);
        };
    }, [navigation]);

    if (Platform.OS !== 'web') return null;

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <iframe
                srcDoc={LANDING_PAGE_HTML}
                style={{
                    flex: 1,
                    border: 'none',
                    width: '100%',
                    height: '100vh',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}
            />
        </View>
    );
}
