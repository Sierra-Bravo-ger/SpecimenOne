#!/usr/bin/env python3
"""Einmaliges Werkzeug: hebt die Textfarben in kategorie-badges.css und material-badges.css auf WCAG AA (4,5:1).

- kategorie-badges.css: Farbton bleibt, Text wird (hell: dunkler, dunkel: heller) gemischt, bis 4,6:1 erreicht sind.
  Die Dunkel-Regeln hängen künftig an `.dark-theme` (App-Umschalter) statt an prefers-color-scheme;
  Kommentare entfallen beim Neuschreiben.
- material-badges.css: Hintergrund wird bei zu geringem Kontrast abgedunkelt bzw. aufgehellt, Text-Schatten entfällt.
Aufruf im Repo-Root: python3 scripts/kontrast-fix.py
"""
import re
import pathlib

ZIEL = 4.6


def hexrgb(h):
    h = h.lstrip('#')
    if len(h) == 3:
        h = ''.join(c * 2 for c in h)
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def lum(c):
    def f(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (f(x) for x in c)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def tohex(c):
    return '#%02x%02x%02x' % c


def kategorie(path):
    css = re.sub(r'/\*.*?\*/', '', path.read_text(), flags=re.S)

    def regel(sel, body, dark):
        mc = re.search(r'(?<![-\w])color:\s*(#[0-9a-fA-F]{3,6})', body)
        mb = re.search(r'background-color:\s*rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)', body)
        if mc and mb:
            fg = hexrgb(mc.group(1))
            base = (31, 41, 55) if dark else (255, 255, 255)   # Karte: gray-800 bzw. weiß
            bg = mix(base, tuple(int(mb.group(k)) for k in (1, 2, 3)), float(mb.group(4)))
            ziel = (255, 255, 255) if dark else (0, 0, 0)
            t = 0.0
            while ratio(mix(fg, ziel, t), bg) < ZIEL and t < 1:
                t += 0.02
            body = body.replace(mc.group(0), 'color: ' + tohex(mix(fg, ziel, t)))
        if dark:
            sel = ',\n'.join('.dark-theme ' + x.strip() for x in sel.split(','))
        return sel.strip() + ' {' + body + '}\n'

    def block(text, dark):
        out, pos = [], 0
        while True:
            i = text.find('{', pos)
            if i < 0:
                break
            prelude, d, j = text[pos:i].strip(), 1, i + 1
            while d:
                d += (text[j] == '{') - (text[j] == '}')
                j += 1
            inner = text[i + 1:j - 1]
            if prelude.startswith('@media (prefers-color-scheme: dark)'):
                out.append(block(inner, True))      # flachgezogen, Selektoren hängen an .dark-theme
            elif prelude.startswith('@'):
                out.append(prelude + ' {' + inner + '}\n')
            else:
                out.append(regel(prelude, inner, dark))
            pos = j
        return '\n'.join(out)
    path.write_text(block(css, False))


def material(path):
    css = path.read_text()
    rule = re.compile(r'(\.material-[\w-]+)\s*\{([^{}]*)\}')

    def fix(m):
        sel, body = m.group(1), m.group(2)
        mb = re.search(r'background-color:\s*(#[0-9a-fA-F]{6})', body)
        mc = re.search(r'(?<![-\w])color:\s*(white|black|#[0-9a-fA-F]{3,6})', body)
        if not (mb and mc):
            return m.group(0)
        bg = hexrgb(mb.group(1))
        fg = {'white': (255, 255, 255), 'black': (0, 0, 0)}.get(mc.group(1)) or hexrgb(mc.group(1))
        t, ziel = 0.0, ((0, 0, 0) if lum(fg) > 0.5 else (255, 255, 255))
        nb = bg
        while ratio(fg, nb) < ZIEL and t < 1:
            t += 0.02
            nb = mix(bg, ziel, t)
        if nb != bg:
            body = body.replace(mb.group(1), tohex(nb))
        body = re.sub(r'\s*text-shadow:[^;]*;', '', body)
        return sel + ' {' + body + '}'
    path.write_text(rule.sub(fix, css))


if __name__ == '__main__':
    root = pathlib.Path('src/styles')
    kategorie(root / 'kategorie-badges.css')
    material(root / 'material-badges.css')
    print('fertig')
