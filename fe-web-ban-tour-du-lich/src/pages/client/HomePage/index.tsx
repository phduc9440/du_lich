import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { Button, Carousel, Flex, Typography, Image, Row, Col, Skeleton } from "antd";
import CustomDivider from "../../../components/CustomDevider";
import SuggestTravelCard from "../../../components/SuggestTravelCard";
import PlaceCard from "../../../components/PlaceCard";
import ReviewCard from "../../../components/ReviewCard";
import heroBanner from '../../../assets/imgs/heroBanner.png';
import heroBanner2 from '../../../assets/imgs/heroBanner2.png';
import heroBanner3 from '../../../assets/imgs/heroBanner3.png';
import FadeIn from "../../../components/FadeIn";
import { useGetTourGallery, useGetToursPopular, useGetToursSuggested } from "../../../services/tourService";
import { useGetTopReviewsQuery } from "../../../services/reviewService";

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const getToursPopularApi = useGetToursPopular();
  const getTourGalleryApi = useGetTourGallery();
  const getToursSuggestedApi = useGetToursSuggested();
  const getTopReviewsApi = useGetTopReviewsQuery();
  
  
  return (
    <>
      <div className="relative">
        <Carousel autoplay={{ dotDuration: true }} autoplaySpeed={5000} dotPosition="right">
          <div>
            <div className="h-[400px] bg-cover bg-bottom" style={{ backgroundImage: `url(${heroBanner})` }}>
            </div>
          </div>
          <div>
            <div className="h-[400px] bg-cover bg-bottom" style={{ backgroundImage: `url(${heroBanner2})` }}>
            </div>
          </div>
          <div>
            <div className="h-[400px] bg-cover bg-bottom" style={{ backgroundImage: `url(${heroBanner3})` }}>
            </div>
          </div>
        </Carousel>
        <div className="absolute inset-0 top-32 left-16 flex flex-col gap-4 items-start">
          <Typography.Title level={2} className="!text-white">Hãy bắt đầu hành trình đáng nhớ của bạn
            cùng chúng tôi.</Typography.Title>
          <Typography.Text className="!text-white">Khám phá những điểm đến tuyệt vời, trải nghiệm văn hóa độc đáo và tạo nên những kỷ niệm không thể nào quên.</Typography.Text>
          <Button type="primary" className="rounded-[6px] px-5 py-0" onClick={() => navigate('list-tour')}>Khám phá ngay</Button>
        </div>
      </div>
      <div className="px-16 py-4">
        <Flex vertical>
          <Typography.Title level={3} className="!mb-0">Điểm đến phổ biến</Typography.Title>
          <CustomDivider width={100} color="red" thickness={2} />
          <Typography.Text>Những điểm đến phổ biến nhất trên thế giới, từ những địa danh lịch sử đến kỳ quan thiên nhiên.</Typography.Text>
        </Flex>
        <div className="flex flex-col items-center my-8">
          <div className="w-full">
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={32}
              slidesPerView={'auto'}
              // breakpoints={{
              //   480: { slidesPerView: 1.8, spaceBetween: 16 },
              //   640: { slidesPerView: 2.4, spaceBetween: 20 },
              //   768: { slidesPerView: 3.2, spaceBetween: 24 },
              //   1024: { slidesPerView: 4, spaceBetween: 28 },
              // }}
              // centeredSlides={true}
              navigation
            // pagination={{ clickable: true }}
            >
              {getToursPopularApi.isLoading ? (<Skeleton/>) : (
                getToursPopularApi.data.data.map((item, i) => (
                  <SwiperSlide key={i} className="w-full xs:!w-[220px] sm:!w-[240px] md:!w-[250px]">
                    <PlaceCard {...item} />
                  </SwiperSlide>
                ))
              )}
            </Swiper>
          </div>
        </div>
        <Flex vertical align="end" className="mb-8">
          <Typography.Title level={3} className="!mb-0">Đề xuất cho bạn</Typography.Title>
          <CustomDivider width={100} color="red" thickness={2} />
          <Typography.Text>Kiểm tra ưu đãi đặc biệt và giảm giá của chúng tôi.</Typography.Text>
        </Flex>
        <FadeIn>
          { getToursSuggestedApi.isLoading ? (<Skeleton/>) : (
            <Row gutter={[16, 16]}>
              {getToursSuggestedApi.data.data.map((tour) => (
              <Col key={tour.id} xs={24} sm={12}  md={8} lg={6}><SuggestTravelCard item={tour} onClick={() => navigate(`/detail/${tour.id}`)}/></Col>
            ))}
            </Row>
          )}
        </FadeIn>
        <Flex justify="center" className="my-8">
          <Button type="primary" className="rounded-[6px] px-5 py-0" onClick={() => navigate('list-tour')}>Xem thêm</Button>
        </Flex>
        <Flex vertical className="my-8">
          <Typography.Title level={3} style={{ marginBottom: 0 }}>Thư viện điểm đến</Typography.Title>
          <CustomDivider width={100} color="red" thickness={2} />
          <Typography.Text>Bộ sưu tập ảnh của chúng tôi trong chuyến đi.</Typography.Text>
          {getTourGalleryApi.isLoading ? (
            <Skeleton/>
          ) : (
            <FadeIn>
              <Image.PreviewGroup>
                <Row gutter={[16, 16]}>
                  {getTourGalleryApi.data?.data?.map((img, index) => (
                    <Col
                      key={index}
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                    >
                      <Image
                        src={img}
                        alt={`tour-image-${index}`}
                        width={'100%'}
                        style={{
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              </Image.PreviewGroup>
            </FadeIn>
          )}

        </Flex>
        <Flex vertical className="my-8">
          <Typography.Title level={3} style={{ marginBottom: 0 }}>Trải nghiệm của du khách</Typography.Title>
          <CustomDivider width={100} color="red" thickness={2} />
          <Typography.Text>Đây là một số phản hồi tuyệt vời từ khách du lịch của chúng tôi.</Typography.Text>
        </Flex>
        <FadeIn>
          <div className="flex flex-col items-center my-8">
            { getTopReviewsApi.isLoading ? (<Skeleton/>):(
            <div className="w-full">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={32}
                slidesPerView={'auto'}
              // breakpoints={{
              //   640: { slidesPerView: 1.3, spaceBetween: 20 },
              //   768: { slidesPerView: 1.6, spaceBetween: 24 },
              //   1024: { slidesPerView: 3, spaceBetween: 28 },
              // }}
              // centeredSlides={true}
              // navigation
              // pagination={{ clickable: true }}
              >
               {getTopReviewsApi.data?.data?.map((review) => (
                <SwiperSlide key={review.id} className="w-full sm:!w-[500px] md:!w-[600px] !h-[240px] md:!h-[280px] !flex !items-center">
                  <ReviewCard
                    avatar_url= {review.avatar_url}
                    content={review.contents[0].content}
                    username={review.username}
                    create_at={review.time}
                  />
                </SwiperSlide>
               ))}
              </Swiper>
            </div>)}
          </div>
        </FadeIn>
      </div>
    </>
  );
};

export default HomePage;
