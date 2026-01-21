import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const title = searchParams.get('title') || 'SurviveBase';
  const description = searchParams.get('description') || '오픈월드 생존 건설 게임 큐레이션';
  const image = searchParams.get('image');
  const price = searchParams.get('price');
  const score = searchParams.get('score');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d1117',
          position: 'relative',
        }}
      >
        {/* Background Image */}
        {image && (
          <img
            src={image}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(13,17,23,0.95) 0%, rgba(13,17,23,0.7) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '60px',
            height: '100%',
          }}
        >
          {/* Logo */}
          <div
            style={{
              position: 'absolute',
              top: '40px',
              left: '60px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #58a6ff 0%, #10b981 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              SurviveBase
            </span>
          </div>

          {/* Game Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title */}
            <h1
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: '#e6edf3',
                margin: 0,
                lineHeight: 1.1,
                maxWidth: '900px',
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '24px',
                color: '#8b949e',
                margin: 0,
                maxWidth: '700px',
              }}
            >
              {description}
            </p>

            {/* Meta info */}
            {(price || score) && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
                {score && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ color: '#22c55e', fontSize: '20px', fontWeight: 'bold' }}>
                      {score}% 긍정적
                    </span>
                  </div>
                )}
                {price && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'rgba(88, 166, 255, 0.2)',
                      padding: '8px 16px',
                      borderRadius: '8px',
                    }}
                  >
                    <span style={{ color: '#58a6ff', fontSize: '20px', fontWeight: 'bold' }}>
                      {price}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
