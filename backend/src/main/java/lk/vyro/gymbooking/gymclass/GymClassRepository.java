package lk.vyro.gymbooking.gymclass;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface GymClassRepository extends JpaRepository<GymClass, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT g FROM GymClass g WHERE g.id = :id")
    Optional<GymClass> findByIdForUpdate(@Param("id") Long id);

    List<GymClass> findByStartsAtBetweenOrderByStartsAtAsc(Instant start, Instant end);

    List<GymClass> findAllByOrderByStartsAtAsc();

    long countByStartsAtAfter(Instant after);
}
