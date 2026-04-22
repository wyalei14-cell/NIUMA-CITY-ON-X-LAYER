// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICitizenRegistryForCourse {
    function isCitizen(address owner) external view returns (bool);
}

contract CourseRegistry {
    enum Difficulty { Beginner, Intermediate, Advanced }
    enum CourseStatus { Draft, Active, Deprecated }

    struct Course {
        uint256 id;
        address proposer;
        string title;
        string contentHash;
        Difficulty difficulty;
        CourseStatus status;
        uint256 createdAt;
        uint256 activatedAt;
        uint256 completionCount;
    }

    ICitizenRegistryForCourse public immutable citizenRegistry;
    uint256 public nextCourseId = 1;
    mapping(uint256 => Course) private courses;

    address public governor;

    event CourseProposed(uint256 indexed courseId, address indexed proposer, string title, string contentHash, Difficulty difficulty);
    event CourseActivated(uint256 indexed courseId);
    event CourseDeprecated(uint256 indexed courseId);
    event CourseCompleted(uint256 indexed courseId, address indexed citizen);

    error OnlyCitizen();
    error OnlyGovernor();
    error CourseMissing();
    error CourseNotDraft();
    error CourseNotActive();
    error CourseAlreadyActive();

    constructor(address citizenRegistry_, address governor_) {
        citizenRegistry = ICitizenRegistryForCourse(citizenRegistry_);
        governor = governor_;
    }

    function proposeCourse(
        string calldata title,
        string calldata contentHash,
        Difficulty difficulty
    ) external onlyCitizen returns (uint256 courseId) {
        courseId = nextCourseId++;
        courses[courseId] = Course({
            id: courseId,
            proposer: msg.sender,
            title: title,
            contentHash: contentHash,
            difficulty: difficulty,
            status: CourseStatus.Draft,
            createdAt: block.timestamp,
            activatedAt: 0,
            completionCount: 0
        });
        emit CourseProposed(courseId, msg.sender, title, contentHash, difficulty);
    }

    function activateCourse(uint256 courseId) external onlyGovernor {
        Course storage course = existingCourse(courseId);
        if (course.status != CourseStatus.Draft) revert CourseNotDraft();
        course.status = CourseStatus.Active;
        course.activatedAt = block.timestamp;
        emit CourseActivated(courseId);
    }

    function deprecateCourse(uint256 courseId) external onlyGovernor {
        Course storage course = existingCourse(courseId);
        if (course.status != CourseStatus.Active) revert CourseNotActive();
        course.status = CourseStatus.Deprecated;
        emit CourseDeprecated(courseId);
    }

    function recordCompletion(uint256 courseId) external onlyCitizen {
        Course storage course = existingCourse(courseId);
        if (course.status != CourseStatus.Active) revert CourseNotActive();
        course.completionCount += 1;
        emit CourseCompleted(courseId, msg.sender);
    }

    function getCourse(uint256 courseId) external view returns (Course memory) {
        return existingCourse(courseId);
    }

    function getCourseStatus(uint256 courseId) external view returns (uint8) {
        Course storage course = existingCourse(courseId);
        return uint8(course.status);
    }

    function getCourseCount() external view returns (uint256) {
        return nextCourseId - 1;
    }

    function setGovernor(address newGovernor) external onlyGovernor {
        governor = newGovernor;
    }

    function existingCourse(uint256 courseId) private view returns (Course storage course) {
        course = courses[courseId];
        if (course.id == 0) revert CourseMissing();
    }

    modifier onlyCitizen() {
        if (!citizenRegistry.isCitizen(msg.sender)) revert OnlyCitizen();
        _;
    }

    modifier onlyGovernor() {
        if (msg.sender != governor) revert OnlyGovernor();
        _;
    }
}
