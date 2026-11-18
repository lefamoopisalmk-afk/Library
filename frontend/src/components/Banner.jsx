import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { ArrowRightIcon } from './Icons.jsx';

// The hero card from the Deli//Break reference: words on the left, a warm
// photo in a rounded arch on the right, one pill button with a round arrow.
// `tone="dark"` gives the espresso version used for smaller promo bands.
// With more than one slide it rotates slowly and the dots switch slides.
export default function Banner({ slides, image, tone = 'light', compact = false, interval = 6500, children }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const many = slides.length > 1;
  const photo = slides[index]?.image || image;

  useEffect(() => {
    if (!many || paused || reducedMotion) return undefined;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
  }, [many, paused, reducedMotion, slides.length, interval]);

  const renderCta = (cta, active) => {
    if (!cta) return null;
    const inner = (
      <>
        {cta.label}
        <span className="pill-btn-icon">
          <ArrowRightIcon />
        </span>
      </>
    );
    return cta.to ? (
      <Link to={cta.to} className="pill-btn" tabIndex={active ? 0 : -1}>
        {inner}
      </Link>
    ) : (
      <a href={cta.href} className="pill-btn" tabIndex={active ? 0 : -1}>
        {inner}
      </a>
    );
  };

  return (
    <section
      className={`banner banner-${tone}${compact ? ' banner-compact' : ''}`}
      aria-roledescription={many ? 'carousel' : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="banner-slides">
        {slides.map((s, i) => {
          const Title = i === 0 && s.asHeading ? 'h1' : 'p';
          return (
            <div key={s.lines.join(' ')} className={`banner-slide${i === index ? ' is-active' : ''}`} aria-hidden={i !== index}>
              {s.kicker ? <p className="banner-kicker">{s.kicker}</p> : null}
              <Title className="banner-title">
                {s.lines.map((line, n) => (
                  <span key={line} className={n === s.lines.length - 1 ? 'is-accent' : ''}>
                    {line}
                  </span>
                ))}
              </Title>
              {s.text ? <p className="banner-text">{s.text}</p> : null}
              {renderCta(s.cta, i === index)}
            </div>
          );
        })}
        {children}
      </div>

      {photo ? (
        <div className="banner-photo">
          <img key={photo} src={photo} alt="" loading="eager" />
        </div>
      ) : null}

      {many ? (
        <div className="banner-dots" role="tablist" aria-label="Choose a slide">
          {slides.map((s, i) => (
            <button
              key={s.lines.join(' ')}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Slide ${i + 1}`}
              className={i === index ? 'is-active' : ''}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
