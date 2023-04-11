// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract PublicInfo {
    mapping(address => Info) userInfo;

    struct Info {
        uint256 age;
        string name;
        string surname;
    }

    // Setters
    function setAge(uint256 _newAge) external {
        userInfo[msg.sender].age = _newAge;
    }

    function setName(string calldata _newName) external {
        userInfo[msg.sender].name = _newName;
    }

    function setSurname(string calldata _newSurname) external {
        userInfo[msg.sender].surname = _newSurname;
    }

    // Getters
    function getAge(address user) external view returns (uint256) {
        return userInfo[user].age;
    }

    function getName(address user) external view returns (string memory) {
        return userInfo[user].name;
    }

    function getSurname(address user) external view returns (string memory) {
        return userInfo[user].surname;
    }
}
