'use client'

import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Loader2, Menu } from 'lucide-react'

const Header = () => {
  const path = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavClick = (navPath, refresh = false) => {
    setLoading(true)
    setIsMobileMenuOpen(false) // Close mobile menu on nav click
    if (path === navPath && refresh) {
      router.refresh()
    } else {
      router.push(navPath)
    }
    setTimeout(() => setLoading(false), 1500)
  }

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      onClick: () => handleNavClick('/dashboard', true),
    },
    {
      label: 'Questions',
      path: '/dashboard/questions',
      onClick: () => handleNavClick('/dashboard/questions'),
    },
    {
      label: 'Upgrade',
      path: '/dashboard/upgrade',
      onClick: () => handleNavClick('/dashboard/upgrade'),
    },
    {
      label: 'How it works?',
      path: '/dashboard/howitwork',
      onClick: () => handleNavClick('/dashboard/howitwork'),
    },
  ]

  return (
    <>
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      <header className="flex p-4 items-center justify-between bg-secondary shadow-md relative">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.svg"
            width={160}
            height={60}
            alt="logo"
            style={{ height: 'auto', width: 'auto' }}
            priority
          />

          {/* Hamburger icon (mobile only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden block"
          >
            <Menu className="w-6 h-6 text-blue-600" />
          </button>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <li
              key={item.path}
              onClick={item.onClick}
              className={`list-none cursor-pointer transition-all hover:text-blue-600 hover:font-bold text-blue-500
              ${path === item.path ? 'text-blue-700 font-bold' : ''}`}
            >
              {item.label}
            </li>
          ))}
        </nav>

        <div>
          <UserButton afterSignOutUrl="/" />
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-[72px] left-0 w-full bg-white border-t shadow-md flex flex-col items-start px-6 py-4 gap-4 z-40 md:hidden">
            {navItems.map((item) => (
              <div
                key={item.path}
                onClick={item.onClick}
                className={`cursor-pointer transition-all hover:text-blue-600 hover:font-bold text-blue-500
                ${path === item.path ? 'text-blue-700 font-bold' : ''}`}
              >
                {item.label}
              </div>
            ))}
          </div>
        )}
      </header>
    </>
  )
}

export default Header
