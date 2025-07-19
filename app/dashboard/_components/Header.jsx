"use client"

import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const Header = () => {
  const path = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleNavClick = (navPath, refresh = false) => {
    setLoading(true)
    if (path === navPath && refresh) {
      router.refresh()
    } else {
      router.push(navPath)
    }
    setTimeout(() => setLoading(false), 1500) // Simulate delay
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

  useEffect(() => {
    console.log(path)
  }, [])

  return (
    <>
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      <header className="flex p-4 items-center justify-between bg-secondary shadow-md">
        <Image
          src="/logo.svg"
          width={160}
          height={60}
          alt="logo"
          style={{ height: 'auto', width: 'auto' }}
          priority
        />

        <nav>
          <ul className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <li
                key={item.path}
                onClick={item.onClick}
                className={`cursor-pointer transition-all hover:text-blue-600 hover:font-bold text-blue-500
                ${path === item.path ? 'text-blue-700 font-bold' : ''}`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
    </>
  )
}

export default Header
