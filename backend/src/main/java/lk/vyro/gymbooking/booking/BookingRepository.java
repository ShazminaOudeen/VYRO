package lk.vyro.gymbooking.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    long countByGymClassIdAndStatus(Long classId, BookingStatus status);

    boolean existsByGymClassIdAndMemberIdAndStatusIn(Long classId, Long memberId, Collection<BookingStatus> statuses);

    Optional<Booking> findByIdAndMemberId(Long id, Long memberId);

    List<Booking> findByGymClassIdAndStatusOrderByCreatedAtAscIdAsc(Long classId, BookingStatus status);

    @Query("SELECT COUNT(b) FROM Booking b WHERE b.gymClass.id = :classId AND b.status = 'WAITLISTED' AND (b.createdAt < :createdAt OR (b.createdAt = :createdAt AND b.id <= :id))")
    long findWaitlistPosition(@Param("classId") Long classId, @Param("createdAt") Instant createdAt, @Param("id") Long id);

    @Query("SELECT b FROM Booking b JOIN FETCH b.gymClass g WHERE b.member.id = :memberId AND b.status = 'BOOKED'")
    List<Booking> findActiveBookingsByMember(@Param("memberId") Long memberId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.gymClass g WHERE b.member.id = :memberId ORDER BY g.startsAt ASC")
    List<Booking> findAllByMemberIdWithClass(@Param("memberId") Long memberId);

    @Query("SELECT b FROM Booking b JOIN FETCH b.member m WHERE b.gymClass.id = :classId AND b.status IN :statuses ORDER BY b.createdAt ASC, b.id ASC")
    List<Booking> findRosterByClassId(@Param("classId") Long classId, @Param("statuses") Collection<BookingStatus> statuses);
}
