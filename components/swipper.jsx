"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCreative } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-creative";
import Image from "next/image";

const slides = [
	{
		title: "Welcome to TurraniX!",
		image: "https://iili.io/FLyNvVf.jpg",
	},
	{
		title: "Instant Wallet & Rewards",
		image: "/2.jpg",
	},
	{
		title: "Join Exciting Matches",
		image: "/3.jpg",
	},
	{
		title: "Instant Wallet & Rewards",
		image: "https://iili.io/F4m7Wlt.jpg",
	},
	{
		title: "Join Exciting Matches",
		image: "https://iili.io/F4yp5mJ.jpg",
	}
];


export default function ExpoSlider() {
	return (
		<div className="w-full flex items-center justify-center">
			<Swiper
				modules={[Autoplay, Pagination, EffectCreative]}
				effect="creative"
				creativeEffect={{
					prev: {
						shadow: true,
						translate: ["-20%", 0, -1],
						scale: 0.8,
						opacity: 0.5,
					},
					next: {
						translate: ["20%", 0, -1],
						scale: 0.8,
						opacity: 0.5,
					},
				}}
				centeredSlides
				slidesPerView={1.1}
				loop
				grabCursor
				pagination={{ clickable: true }}
				autoplay={{ delay: 3000, disableOnInteraction: false }}
				className="w-full max-w-4xl mx-auto overflow-visible"
			>
				{slides.map((slide, index) => (
					<SwiperSlide
						key={index}
						className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg max-w-[90vw] sm:max-w-[70vw] md:max-w-[60vw]"
					>
						<Image
							src={slide.image}
							alt=""
							fill
							className="absolute inset-0 w-full h-full object-cover transition-transform duration-[4000ms] ease-[cubic-bezier(0.25,1,0.5,1)] scale-100"
						/>
						<div className="absolute inset-0 bg-black/10 z-10" />
						{/* Removed all text overlays */}
					</SwiperSlide>
				))}
			</Swiper>
		</div>
	);
}
