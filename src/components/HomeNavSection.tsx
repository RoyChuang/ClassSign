'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { SvgIconComponent } from '@mui/icons-material'

export type HomeNavItem = {
  href: string
  label: string
  desc: string
  Icon: SvgIconComponent
}

const toneMap = {
  sky: {
    shellBg: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(244,248,255,0.8) 100%)',
    border: 'rgba(191,219,254,0.74)',
    pillBg: 'rgba(239,244,255,0.96)',
    pillText: '#1D4ED8',
    dot: '#2563EB',
    divider: 'linear-gradient(90deg, rgba(96,165,250,0.42), rgba(96,165,250,0))',
    glowA: 'rgba(59,130,246,0.16)',
    glowB: 'rgba(14,165,233,0.12)',
  },
  slate: {
    shellBg: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.82) 100%)',
    border: 'rgba(203,213,225,0.86)',
    pillBg: 'rgba(241,245,249,0.98)',
    pillText: '#0F172A',
    dot: '#0F172A',
    divider: 'linear-gradient(90deg, rgba(100,116,139,0.42), rgba(100,116,139,0))',
    glowA: 'rgba(15,23,42,0.06)',
    glowB: 'rgba(37,99,235,0.08)',
  },
} as const

function HomeNavCard({ href, label, desc, Icon }: HomeNavItem) {
  return (
    <Card
      sx={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.76)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.95)',
        boxShadow: '0 10px 35px rgba(37,99,235,0.08)',
        overflow: 'hidden',
        transition: 'transform 180ms ease, box-shadow 220ms ease, background 220ms ease, border-color 220ms ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          background: 'rgba(255,255,255,0.92)',
          borderColor: 'rgba(37,99,235,0.24)',
          boxShadow: '0 16px 40px rgba(37,99,235,0.14)',
        },
        '&:focus-within': {
          borderColor: 'rgba(37,99,235,0.42)',
          boxShadow: '0 0 0 4px rgba(37,99,235,0.12), 0 16px 40px rgba(37,99,235,0.14)',
        },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '&:hover': { transform: 'none' },
        },
      }}
    >
      <CardActionArea
        component={Link}
        href={href}
        aria-label={`${label}：${desc}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 'inherit',
          touchAction: 'manipulation',
          '& .nav-icon-wrap': {
            transition: 'background 220ms ease, color 220ms ease, transform 180ms ease',
          },
          '& .nav-arrow': {
            opacity: 0.45,
            transform: 'translateX(0)',
            transition: 'opacity 220ms ease, transform 220ms cubic-bezier(.2,.7,.2,1)',
          },
          '&:hover .nav-icon-wrap, &.Mui-focusVisible .nav-icon-wrap': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            transform: 'scale(1.02)',
          },
          '&:hover .nav-arrow, &.Mui-focusVisible .nav-arrow': {
            opacity: 1,
            transform: 'translateX(2px)',
          },
          '&.Mui-focusVisible': {
            bgcolor: 'rgba(255,255,255,0.96)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            '& .nav-icon-wrap, & .nav-arrow': { transition: 'none' },
          },
        }}
      >
        <Box
          className="nav-icon-wrap"
          sx={{
            width: 48,
            height: 48,
            borderRadius: '16px',
            bgcolor: 'rgba(37,99,235,0.08)',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 22, color: 'inherit' }} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17, color: 'text.primary', lineHeight: 1.3 }}>
            {label}
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5, fontSize: 15.5, lineHeight: 1.6 }}>
            {desc}
          </Typography>
        </Box>

        <ChevronRightIcon className="nav-arrow" sx={{ color: 'primary.main', flexShrink: 0 }} />
      </CardActionArea>
    </Card>
  )
}

export function HomeNavSection({
  headingId,
  label,
  description,
  items = [],
  footer,
  tone = 'sky',
}: {
  headingId: string
  label: string
  description?: string
  items?: HomeNavItem[]
  footer?: ReactNode
  tone?: keyof typeof toneMap
}) {
  const toneStyle = toneMap[tone]

  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2.25, sm: 2.75 },
        borderRadius: { xs: '24px', sm: '28px' },
        background: toneStyle.shellBg,
        border: `1px solid ${toneStyle.border}`,
        boxShadow: '0 24px 60px rgba(15,23,42,0.08)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        minHeight: '100%',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: -24,
          right: -18,
          width: 160,
          height: 160,
          borderRadius: '50%',
          background: toneStyle.glowA,
          filter: 'blur(14px)',
        }}
      />
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          bottom: -44,
          left: -10,
          width: 136,
          height: 136,
          borderRadius: '50%',
          background: toneStyle.glowB,
          filter: 'blur(18px)',
        }}
      />

      <Box sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: description ? 1 : 1.75 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.625,
              bgcolor: toneStyle.pillBg,
              border: `1px solid ${toneStyle.border}`,
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: toneStyle.dot, flexShrink: 0 }} />
            <Typography component="h2" id={headingId} sx={{ fontSize: 14, fontWeight: 700, color: toneStyle.pillText, letterSpacing: '0.02em' }}>
              {label}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, height: '1px', background: toneStyle.divider }} />
        </Box>

        {description && (
          <Typography sx={{ mb: items.length ? 1.75 : 0, color: 'text.secondary', fontSize: 15.5, lineHeight: 1.75 }}>
            {description}
          </Typography>
        )}

        {items.length > 0 && (
          <Box component="nav" aria-labelledby={headingId}>
            <Box component="ul" sx={{ display: 'grid', gap: 1.5, p: 0, m: 0, listStyle: 'none' }}>
              {items.map(item => (
                <Box component="li" key={item.href}>
                  <HomeNavCard {...item} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {footer ? <Box sx={{ mt: items.length ? 2.25 : 0 }}>{footer}</Box> : null}
      </Box>
    </Box>
  )
}