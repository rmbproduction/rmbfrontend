import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface VehicleImageSliderProps {
  images: string[];
  title: string;
}

const VehicleImageSlider: React.FC<VehicleImageSliderProps> = ({ images, title }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  if (!images.length) return null;

  return (
    <div className="mb-12">
      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 mb-4">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, Thumbs]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          className="h-full w-full rounded-lg"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <img
                src={image}
                alt={`${title} - View ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="px-2 mt-4">
          <Swiper
            onSwiper={setThumbsSwiper}
            modules={[Navigation, Thumbs, FreeMode]}
            spaceBetween={16}
            slidesPerView="auto"
            freeMode={true}
            watchSlidesProgress={true}
            className="thumbs-swiper"
            centerInsufficientSlides={true}
            breakpoints={{
              0: {
                slidesPerView: 3,
                spaceBetween: 12,
              },
              480: {
                slidesPerView: 4,
                spaceBetween: 16,
              },
              768: {
                slidesPerView: 5,
                spaceBetween: 16,
              }
            }}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="aspect-square w-20 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent transition-all duration-200">
                  <img
                    src={image}
                    alt={`${title} - Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default VehicleImageSlider; 