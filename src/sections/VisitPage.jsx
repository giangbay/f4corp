import { useApiResource } from "../api.js";
import ResourceStatus from "../components/ResourceStatus.jsx";

export default function VisitPage() {
  const { data: locations, loading, error } = useApiResource("/locations");

  return (
    <section className="visit" id="ghe-choi">
      <div className="visit-grid container">
        <div className="visit-copy">
          <span className="eyebrow">Mộc ở đây nè</span>
          <h1>Ghé chơi một chút, ở lại thật lâu.</h1>
          <p>
            Cửa tiệm nhỏ luôn mở cửa đón bạn. Rủ một người thương, mang theo
            cuốn sách hay — phần còn lại để Mộc lo.
          </p>
          <a
            className="button"
            href="https://maps.google.com/?q=448+Tay+Son,+Dong+Da,+Ha+Noi"
            target="_blank"
            rel="noreferrer"
          >
            Xem đường đến quán <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="visit-info">
          <ResourceStatus loading={loading} error={error} />
          {!loading &&
            !error &&
            locations.map((location) => (
              <div className="visit-details" key={location.id}>
                <div className="detail">
                  <span className="detail-icon" aria-hidden="true">
                    ⌖
                  </span>
                  <div>
                    <strong>Địa chỉ</strong>
                    <span>
                      {location.address}
                      <br />
                      {location.city}
                    </span>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon" aria-hidden="true">
                    ◷
                  </span>
                  <div>
                    <strong>Giờ mở cửa</strong>
                    <span>{location.openingHours}</span>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon" aria-hidden="true">
                    ✆
                  </span>
                  <div>
                    <strong>Gọi cho Mộc</strong>
                    <a href={`tel:${location.phone.replaceAll(" ", "")}`}>
                      {location.phone}
                    </a>
                    <span>Luôn sẵn lòng nghe bạn</span>
                  </div>
                </div>
                <div className="detail">
                  <span className="detail-icon" aria-hidden="true">
                    ♡
                  </span>
                  <div>
                    <strong>Góc dễ thương</strong>
                    {location.amenities.map((amenity) => (
                      <span key={amenity}>{amenity}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          <iframe
            className="visit-map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.7302975413368!2d105.81749967408538!3d21.003445580639546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ad6bac255e3b%3A0xe3d95a386e62264d!2sCafe%20448!5e0!3m2!1svi!2s!4v1795255518413!5m2!1svi!2s"
            title="Bản đồ Cafe 448 trên Google Maps"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </section>
  );
}
